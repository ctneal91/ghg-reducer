# Climatiq API client for emission factor calculations
# Documentation: https://www.climatiq.io/docs
class ClimatiqClient
  BASE_URL = "https://api.climatiq.io".freeze
  DATA_VERSION = "^21".freeze

  # Mapping of our activity types to Climatiq activity IDs
  ACTIVITY_MAPPINGS = {
    "driving" => {
      activity_id: "passenger_vehicle-vehicle_type_car-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na",
      parameter_key: "distance",
      parameter_unit: "km"
    },
    "flight" => {
      activity_id: "passenger_flight-route_type_na-aircraft_type_na-distance_na-class_na-rf_included",
      parameter_key: "passengers_distance",
      parameter_unit: "passenger-km"
    },
    "electricity" => {
      activity_id: "electricity-supply_grid-source_residual_mix",
      parameter_key: "energy",
      parameter_unit: "kWh"
    },
    "natural_gas" => {
      activity_id: "fuel_type_natural_gas-fuel_use_stationary_combustion",
      parameter_key: "energy",
      parameter_unit: "therm"
    },
    "food_beef" => {
      activity_id: "consumer_goods-type_meat_products_beef",
      parameter_key: "money",
      parameter_unit: "usd"
    },
    "food_chicken" => {
      activity_id: "consumer_goods-type_meat_products_poultry",
      parameter_key: "money",
      parameter_unit: "usd"
    },
    "purchase" => {
      activity_id: "consumer_goods-type_consumer_goods",
      parameter_key: "money",
      parameter_unit: "usd"
    }
  }.freeze

  class ApiError < StandardError
    attr_reader :status, :body

    def initialize(message, status: nil, body: nil)
      super(message)
      @status = status
      @body = body
    end
  end

  def initialize(api_key: nil)
    @api_key = api_key || ENV.fetch("CLIMATIQ_API_KEY", nil)
  end

  def configured?
    @api_key.present?
  end

  # Estimate emissions for a given activity
  # Returns hash with :co2e (kg), :source, :activity_id, or nil if API unavailable
  def estimate(activity_type:, quantity:, region: "GLOBAL")
    return nil unless configured?

    mapping = ACTIVITY_MAPPINGS[activity_type]
    return nil unless mapping

    body = build_request_body(mapping, quantity, region)
    response = post("/data/v1/estimate", body)

    parse_estimate_response(response, mapping[:activity_id])
  rescue ApiError, Net::HTTPError, Timeout::Error, JSON::ParserError => e
    Rails.logger.warn("Climatiq API error: #{e.message}")
    nil
  end

  # Batch estimate for multiple activities (up to 100)
  def batch_estimate(activities)
    return [] unless configured?
    return [] if activities.empty?

    requests = activities.filter_map do |activity|
      mapping = ACTIVITY_MAPPINGS[activity[:activity_type]]
      next unless mapping

      build_request_body(mapping, activity[:quantity], activity[:region] || "GLOBAL")
    end

    return [] if requests.empty?

    response = post("/data/v1/estimate/batch", requests)
    parse_batch_response(response)
  rescue ApiError, Net::HTTPError, Timeout::Error, JSON::ParserError => e
    Rails.logger.warn("Climatiq batch API error: #{e.message}")
    []
  end

  private

  def build_request_body(mapping, quantity, region)
    {
      emission_factor: {
        activity_id: mapping[:activity_id],
        data_version: DATA_VERSION,
        region: region
      },
      parameters: {
        mapping[:parameter_key] => quantity,
        "#{mapping[:parameter_key]}_unit" => mapping[:parameter_unit]
      }
    }
  end

  def parse_estimate_response(response, activity_id)
    {
      co2e: response["co2e"],
      co2e_unit: response["co2e_unit"],
      source: response.dig("emission_factor", "source") || "Climatiq",
      source_year: response.dig("emission_factor", "year"),
      activity_id: activity_id,
      constituent_gases: response["constituent_gases"]
    }
  end

  def parse_batch_response(response)
    results = response["results"] || response
    return [] unless results.is_a?(Array)

    results.map do |result|
      next nil if result["error"]

      {
        co2e: result["co2e"],
        co2e_unit: result["co2e_unit"],
        source: result.dig("emission_factor", "source") || "Climatiq",
        source_year: result.dig("emission_factor", "year")
      }
    end
  end

  def post(path, body)
    uri = URI("#{BASE_URL}#{path}")
    request = Net::HTTP::Post.new(uri)
    request["Authorization"] = "Bearer #{@api_key}"
    request["Content-Type"] = "application/json"
    request.body = body.to_json

    response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true, open_timeout: 5, read_timeout: 10) do |http|
      http.request(request)
    end

    handle_response(response)
  end

  def handle_response(response)
    body = JSON.parse(response.body)

    case response
    when Net::HTTPSuccess
      body
    when Net::HTTPUnauthorized
      raise ApiError.new("Invalid Climatiq API key", status: 401, body: body)
    when Net::HTTPTooManyRequests
      raise ApiError.new("Climatiq rate limit exceeded", status: 429, body: body)
    else
      message = body["message"] || body["error"] || "Climatiq API error"
      raise ApiError.new(message, status: response.code.to_i, body: body)
    end
  end
end
