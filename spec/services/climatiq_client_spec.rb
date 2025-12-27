require "rails_helper"

RSpec.describe ClimatiqClient do
  let(:api_key) { "test-api-key" }
  let(:client) { described_class.new(api_key: api_key) }

  describe "#configured?" do
    it "returns true when API key is provided" do
      expect(client.configured?).to be true
    end

    it "returns false when API key is nil" do
      client = described_class.new(api_key: nil)
      expect(client.configured?).to be false
    end

    it "returns false when API key is empty" do
      client = described_class.new(api_key: "")
      expect(client.configured?).to be false
    end
  end

  describe "#estimate" do
    let(:success_response) do
      {
        "co2e" => 21.5,
        "co2e_unit" => "kg",
        "emission_factor" => {
          "source" => "EPA",
          "year" => 2023,
          "activity_id" => "passenger_vehicle-vehicle_type_car-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na"
        },
        "constituent_gases" => {
          "co2e_total" => 21.5,
          "co2" => 20.0,
          "ch4" => 0.5,
          "n2o" => 1.0
        }
      }
    end

    context "when API is not configured" do
      let(:client) { described_class.new(api_key: nil) }

      it "returns nil" do
        result = client.estimate(activity_type: "driving", quantity: 100)
        expect(result).to be_nil
      end
    end

    context "when activity type is unknown" do
      it "returns nil" do
        result = client.estimate(activity_type: "unknown_type", quantity: 100)
        expect(result).to be_nil
      end
    end

    context "when API call succeeds" do
      before do
        stub_request(:post, "https://api.climatiq.io/data/v1/estimate")
          .with(
            headers: { "Authorization" => "Bearer #{api_key}", "Content-Type" => "application/json" }
          )
          .to_return(status: 200, body: success_response.to_json, headers: { "Content-Type" => "application/json" })
      end

      it "returns emission estimate for driving" do
        result = client.estimate(activity_type: "driving", quantity: 100)

        expect(result[:co2e]).to eq(21.5)
        expect(result[:co2e_unit]).to eq("kg")
        expect(result[:source]).to eq("EPA")
        expect(result[:source_year]).to eq(2023)
      end

      it "sends correct request body for driving" do
        client.estimate(activity_type: "driving", quantity: 100)

        expect(WebMock).to have_requested(:post, "https://api.climatiq.io/data/v1/estimate")
          .with(body: hash_including(
            "emission_factor" => hash_including(
              "activity_id" => "passenger_vehicle-vehicle_type_car-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na"
            ),
            "parameters" => { "distance" => 100, "distance_unit" => "km" }
          ))
      end

      it "sends correct request body for electricity" do
        client.estimate(activity_type: "electricity", quantity: 500)

        expect(WebMock).to have_requested(:post, "https://api.climatiq.io/data/v1/estimate")
          .with(body: hash_including(
            "emission_factor" => hash_including(
              "activity_id" => "electricity-supply_grid-source_residual_mix"
            ),
            "parameters" => { "energy" => 500, "energy_unit" => "kWh" }
          ))
      end

      it "sends correct request body for flight" do
        client.estimate(activity_type: "flight", quantity: 1000)

        expect(WebMock).to have_requested(:post, "https://api.climatiq.io/data/v1/estimate")
          .with(body: hash_including(
            "parameters" => { "passengers_distance" => 1000, "passengers_distance_unit" => "passenger-km" }
          ))
      end
    end

    context "when API returns an error" do
      before do
        stub_request(:post, "https://api.climatiq.io/data/v1/estimate")
          .to_return(status: 500, body: { error: "Internal server error" }.to_json)
      end

      it "returns nil and logs warning" do
        expect(Rails.logger).to receive(:warn).with(/Climatiq API error/)
        result = client.estimate(activity_type: "driving", quantity: 100)
        expect(result).to be_nil
      end
    end

    context "when API returns unauthorized" do
      before do
        stub_request(:post, "https://api.climatiq.io/data/v1/estimate")
          .to_return(status: 401, body: { message: "Invalid API key" }.to_json)
      end

      it "returns nil and logs warning" do
        expect(Rails.logger).to receive(:warn).with(/Invalid Climatiq API key/)
        result = client.estimate(activity_type: "driving", quantity: 100)
        expect(result).to be_nil
      end
    end

    context "when API times out" do
      before do
        stub_request(:post, "https://api.climatiq.io/data/v1/estimate")
          .to_timeout
      end

      it "returns nil and logs warning" do
        expect(Rails.logger).to receive(:warn).with(/Climatiq API error/)
        result = client.estimate(activity_type: "driving", quantity: 100)
        expect(result).to be_nil
      end
    end

    context "when API rate limit exceeded" do
      before do
        stub_request(:post, "https://api.climatiq.io/data/v1/estimate")
          .to_return(status: 429, body: { message: "Rate limit exceeded" }.to_json)
      end

      it "returns nil and logs warning" do
        expect(Rails.logger).to receive(:warn).with(/Climatiq rate limit exceeded/)
        result = client.estimate(activity_type: "driving", quantity: 100)
        expect(result).to be_nil
      end
    end
  end

  describe "#batch_estimate" do
    let(:batch_response) do
      {
        "results" => [
          { "co2e" => 21.5, "co2e_unit" => "kg", "emission_factor" => { "source" => "EPA", "year" => 2023 } },
          { "co2e" => 127.5, "co2e_unit" => "kg", "emission_factor" => { "source" => "EPA", "year" => 2023 } }
        ]
      }
    end

    context "when API is not configured" do
      let(:client) { described_class.new(api_key: nil) }

      it "returns empty array" do
        result = client.batch_estimate([ { activity_type: "driving", quantity: 100 } ])
        expect(result).to eq([])
      end
    end

    context "when activities is empty" do
      it "returns empty array" do
        result = client.batch_estimate([])
        expect(result).to eq([])
      end
    end

    context "when all activities have unknown types" do
      it "returns empty array" do
        result = client.batch_estimate([ { activity_type: "unknown", quantity: 100 } ])
        expect(result).to eq([])
      end
    end

    context "when API call succeeds" do
      before do
        stub_request(:post, "https://api.climatiq.io/data/v1/estimate/batch")
          .to_return(status: 200, body: batch_response.to_json, headers: { "Content-Type" => "application/json" })
      end

      it "returns array of estimates" do
        activities = [
          { activity_type: "driving", quantity: 100 },
          { activity_type: "electricity", quantity: 500 }
        ]

        result = client.batch_estimate(activities)

        expect(result.length).to eq(2)
        expect(result[0][:co2e]).to eq(21.5)
        expect(result[1][:co2e]).to eq(127.5)
      end
    end

    context "when API returns error" do
      before do
        stub_request(:post, "https://api.climatiq.io/data/v1/estimate/batch")
          .to_return(status: 500, body: { error: "Server error" }.to_json)
      end

      it "returns empty array" do
        expect(Rails.logger).to receive(:warn).with(/Climatiq batch API error/)
        result = client.batch_estimate([ { activity_type: "driving", quantity: 100 } ])
        expect(result).to eq([])
      end
    end
  end

  describe "ACTIVITY_MAPPINGS" do
    it "has mappings for all activity types" do
      expected_types = %w[driving flight electricity natural_gas food_beef food_chicken purchase]
      expect(ClimatiqClient::ACTIVITY_MAPPINGS.keys).to match_array(expected_types)
    end

    it "each mapping has required keys" do
      ClimatiqClient::ACTIVITY_MAPPINGS.each do |type, mapping|
        expect(mapping).to have_key(:activity_id), "#{type} missing activity_id"
        expect(mapping).to have_key(:parameter_key), "#{type} missing parameter_key"
        expect(mapping).to have_key(:parameter_unit), "#{type} missing parameter_unit"
      end
    end
  end
end
