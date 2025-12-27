require "rails_helper"

RSpec.describe Activity, type: :model do
  describe "validations" do
    it "is valid with valid attributes" do
      activity = Activity.new(
        activity_type: "driving",
        quantity: 100,
        occurred_at: Time.current
      )
      expect(activity).to be_valid
    end

    it "requires activity_type" do
      activity = Activity.new(quantity: 100, occurred_at: Time.current)
      expect(activity).not_to be_valid
      expect(activity.errors[:activity_type]).to include("can't be blank")
    end

    it "requires activity_type to be in ACTIVITY_TYPES" do
      activity = Activity.new(activity_type: "invalid", quantity: 100, occurred_at: Time.current)
      expect(activity).not_to be_valid
      expect(activity.errors[:activity_type]).to include("is not included in the list")
    end

    it "requires quantity" do
      activity = Activity.new(activity_type: "driving", occurred_at: Time.current)
      expect(activity).not_to be_valid
      expect(activity.errors[:quantity]).to include("can't be blank")
    end

    it "requires quantity to be greater than 0" do
      activity = Activity.new(activity_type: "driving", quantity: 0, occurred_at: Time.current)
      expect(activity).not_to be_valid
      expect(activity.errors[:quantity]).to include("must be greater than 0")
    end

    it "requires occurred_at" do
      activity = Activity.new(activity_type: "driving", quantity: 100)
      expect(activity).not_to be_valid
      expect(activity.errors[:occurred_at]).to include("can't be blank")
    end
  end

  describe "associations" do
    it "belongs to user optionally" do
      activity = Activity.new(activity_type: "driving", quantity: 100, occurred_at: Time.current)
      expect(activity).to be_valid
    end

    it "can have a user" do
      user = User.create!(name: "Test", email: "test@example.com", password: "password123")
      activity = Activity.create!(
        activity_type: "driving",
        quantity: 100,
        occurred_at: Time.current,
        user: user
      )
      expect(activity.user).to eq(user)
    end
  end

  describe "emission calculation" do
    # Mock the Climatiq client as unconfigured by default so tests use local factors
    before do
      mock_client = instance_double(ClimatiqClient, configured?: false)
      allow(Activity).to receive(:climatiq_client).and_return(mock_client)
    end

    it "calculates emission_kg on save for driving" do
      activity = Activity.create!(activity_type: "driving", quantity: 100, occurred_at: Time.current)
      expect(activity.emission_kg).to eq(21.0) # 100 * 0.21
      expect(activity.unit).to eq("km")
      expect(activity.emission_source).to eq("local")
    end

    it "calculates emission_kg on save for flight" do
      activity = Activity.create!(activity_type: "flight", quantity: 1000, occurred_at: Time.current)
      expect(activity.emission_kg).to eq(255.0) # 1000 * 0.255
      expect(activity.unit).to eq("km")
    end

    it "calculates emission_kg on save for electricity" do
      activity = Activity.create!(activity_type: "electricity", quantity: 500, occurred_at: Time.current)
      expect(activity.emission_kg).to eq(210.0) # 500 * 0.42
      expect(activity.unit).to eq("kWh")
    end

    it "calculates emission_kg on save for natural_gas" do
      activity = Activity.create!(activity_type: "natural_gas", quantity: 10, occurred_at: Time.current)
      expect(activity.emission_kg).to eq(20.0) # 10 * 2.0
      expect(activity.unit).to eq("therm")
    end

    it "calculates emission_kg on save for food_beef" do
      activity = Activity.create!(activity_type: "food_beef", quantity: 2, occurred_at: Time.current)
      expect(activity.emission_kg).to eq(54.0) # 2 * 27.0
      expect(activity.unit).to eq("kg")
    end

    it "calculates emission_kg on save for food_chicken" do
      activity = Activity.create!(activity_type: "food_chicken", quantity: 3, occurred_at: Time.current)
      expect(activity.emission_kg).to eq(20.7) # 3 * 6.9
      expect(activity.unit).to eq("kg")
    end

    it "calculates emission_kg on save for purchase" do
      activity = Activity.create!(activity_type: "purchase", quantity: 100, occurred_at: Time.current)
      expect(activity.emission_kg).to eq(50.0) # 100 * 0.5
      expect(activity.unit).to eq("USD")
    end

    it "recalculates emission when quantity is updated" do
      activity = Activity.create!(activity_type: "driving", quantity: 100, occurred_at: Time.current)
      expect(activity.emission_kg).to eq(21.0)

      activity.update!(quantity: 200)
      expect(activity.emission_kg).to eq(42.0)
    end
  end

  describe ".emission_factor_for" do
    it "returns factor data for valid activity type" do
      result = Activity.emission_factor_for("driving")
      expect(result).to eq({ factor: 0.21, unit: "km", description: "kg CO2 per kilometer" })
    end

    it "returns nil for invalid activity type" do
      result = Activity.emission_factor_for("invalid")
      expect(result).to be_nil
    end
  end

  describe "ACTIVITY_TYPES" do
    it "contains all expected activity types" do
      expected = %w[driving flight electricity natural_gas food_beef food_chicken purchase]
      expect(Activity::ACTIVITY_TYPES).to eq(expected)
    end
  end

  describe ".climatiq_client" do
    it "returns a ClimatiqClient instance" do
      # Clear the memoized client and allow real instantiation
      Activity.instance_variable_set(:@climatiq_client, nil)
      allow(Activity).to receive(:climatiq_client).and_call_original

      client = Activity.climatiq_client
      expect(client).to be_a(ClimatiqClient)
    end
  end

  describe "Climatiq integration" do
    let(:mock_client) { instance_double(ClimatiqClient) }

    before do
      allow(Activity).to receive(:climatiq_client).and_return(mock_client)
    end

    context "when Climatiq is configured and returns data" do
      before do
        allow(mock_client).to receive(:configured?).and_return(true)
        allow(mock_client).to receive(:estimate).and_return({
          co2e: 25.5,
          co2e_unit: "kg",
          source: "EPA",
          source_year: 2023
        })
      end

      it "uses Climatiq emission values" do
        activity = Activity.create!(activity_type: "driving", quantity: 100, occurred_at: Time.current)

        expect(activity.emission_kg).to eq(25.5)
        expect(activity.emission_source).to eq("EPA")
        expect(activity.unit).to eq("km")
      end

      it "calls Climatiq with correct parameters" do
        expect(mock_client).to receive(:estimate).with(
          activity_type: "electricity",
          quantity: 500
        )

        Activity.create!(activity_type: "electricity", quantity: 500, occurred_at: Time.current)
      end
    end

    context "when Climatiq is configured but returns nil" do
      before do
        allow(mock_client).to receive(:configured?).and_return(true)
        allow(mock_client).to receive(:estimate).and_return(nil)
      end

      it "falls back to local emission factors" do
        activity = Activity.create!(activity_type: "driving", quantity: 100, occurred_at: Time.current)

        expect(activity.emission_kg).to eq(21.0)
        expect(activity.emission_source).to eq("local")
      end
    end

    context "when Climatiq is not configured" do
      before do
        allow(mock_client).to receive(:configured?).and_return(false)
      end

      it "uses local emission factors" do
        activity = Activity.create!(activity_type: "driving", quantity: 100, occurred_at: Time.current)

        expect(activity.emission_kg).to eq(21.0)
        expect(activity.emission_source).to eq("local")
      end

      it "does not call Climatiq API" do
        expect(mock_client).not_to receive(:estimate)
        Activity.create!(activity_type: "driving", quantity: 100, occurred_at: Time.current)
      end
    end

    context "when Climatiq returns result without source" do
      before do
        allow(mock_client).to receive(:configured?).and_return(true)
        allow(mock_client).to receive(:estimate).and_return({
          co2e: 30.0,
          co2e_unit: "kg",
          source: nil
        })
      end

      it "defaults emission_source to Climatiq" do
        activity = Activity.create!(activity_type: "driving", quantity: 100, occurred_at: Time.current)

        expect(activity.emission_source).to eq("Climatiq")
      end
    end
  end
end
