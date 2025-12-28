class Activity < ApplicationRecord
  belongs_to :user, optional: true

  ACTIVITY_TYPES = %w[driving flight electricity natural_gas food_beef food_chicken purchase].freeze

  # Local fallback emission factors (used when Climatiq API is unavailable)
  EMISSION_FACTORS = {
    "driving" => { factor: 0.21, unit: "km", description: "kg CO2 per kilometer" },
    "flight" => { factor: 0.255, unit: "km", description: "kg CO2 per kilometer" },
    "electricity" => { factor: 0.42, unit: "kWh", description: "kg CO2 per kilowatt-hour" },
    "natural_gas" => { factor: 2.0, unit: "therm", description: "kg CO2 per therm" },
    "food_beef" => { factor: 27.0, unit: "kg", description: "kg CO2 per kilogram" },
    "food_chicken" => { factor: 6.9, unit: "kg", description: "kg CO2 per kilogram" },
    "purchase" => { factor: 0.5, unit: "USD", description: "kg CO2 per dollar spent" }
  }.freeze

  validates :activity_type, presence: true, inclusion: { in: ACTIVITY_TYPES }
  validates :quantity, presence: true, numericality: { greater_than: 0 }
  validates :occurred_at, presence: true

  before_save :calculate_emission

  def self.emission_factor_for(activity_type)
    EMISSION_FACTORS[activity_type]
  end

  def self.climatiq_client
    @climatiq_client ||= ClimatiqClient.new
  end

  private

  def calculate_emission
    # Default region to US if not set
    self.region ||= "US"

    # Try Climatiq API first for real-time emission factors
    if use_climatiq?
      result = self.class.climatiq_client.estimate(
        activity_type: activity_type,
        quantity: quantity,
        region: region
      )

      if result
        self.emission_kg = result[:co2e].round(2)
        self.emission_source = result[:source] || "Climatiq"
        self.unit = EMISSION_FACTORS.dig(activity_type, :unit)
        return
      end
    end

    # Fallback to local emission factors
    calculate_emission_locally
  end

  def calculate_emission_locally
    factor_data = EMISSION_FACTORS[activity_type]
    return unless factor_data

    self.unit = factor_data[:unit]
    self.emission_kg = (quantity * factor_data[:factor]).round(2)
    self.emission_source = "local"
  end

  def use_climatiq?
    self.class.climatiq_client.configured?
  end
end
