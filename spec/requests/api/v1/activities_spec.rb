require "rails_helper"

RSpec.describe "Api::V1::Activities", type: :request do
  let(:session_id) { SecureRandom.uuid }
  let(:headers) { { "X-Session-Id" => session_id } }

  def auth_headers_for(user)
    secret = Rails.application.credentials.secret_key_base || ENV.fetch("SECRET_KEY_BASE", "dev-secret")
    token = JWT.encode({ user_id: user.id, exp: 24.hours.from_now.to_i }, secret, "HS256")
    { "Authorization" => "Bearer #{token}" }
  end

  describe "GET /api/v1/activities" do
    it "returns a list of activities with summary" do
      Activity.create!(activity_type: "driving", quantity: 100, occurred_at: Time.current, session_id: session_id)
      Activity.create!(activity_type: "flight", quantity: 500, occurred_at: Time.current, session_id: session_id)

      get "/api/v1/activities", headers: headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["activities"].length).to eq(2)
      expect(json["summary"]["activity_count"]).to eq(2)
      expect(json["summary"]["total_emissions_kg"].to_f).to be > 0
    end

    it "only returns activities for the current session" do
      Activity.create!(activity_type: "driving", quantity: 100, occurred_at: Time.current, session_id: session_id)
      Activity.create!(activity_type: "flight", quantity: 500, occurred_at: Time.current, session_id: "other-session")

      get "/api/v1/activities", headers: headers

      json = JSON.parse(response.body)
      expect(json["activities"].length).to eq(1)
    end

    it "returns activities for authenticated user" do
      user = User.create!(email: "test@example.com", password: "password123", name: "Test")
      Activity.create!(activity_type: "driving", quantity: 100, occurred_at: Time.current, user_id: user.id)
      Activity.create!(activity_type: "flight", quantity: 500, occurred_at: Time.current, session_id: "other-session")

      get "/api/v1/activities", headers: auth_headers_for(user)

      json = JSON.parse(response.body)
      expect(json["activities"].length).to eq(1)
      expect(json["activities"].first["activity_type"]).to eq("driving")
    end

    it "returns empty list when no session_id or auth" do
      Activity.create!(activity_type: "driving", quantity: 100, occurred_at: Time.current, session_id: session_id)

      get "/api/v1/activities"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["activities"]).to be_empty
    end
  end

  describe "GET /api/v1/activities/:id" do
    it "returns a single activity" do
      activity = Activity.create!(activity_type: "driving", quantity: 50, occurred_at: Time.current, session_id: session_id)

      get "/api/v1/activities/#{activity.id}", headers: headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["activity_type"]).to eq("driving")
    end

    it "returns 404 for activity belonging to another session" do
      activity = Activity.create!(activity_type: "driving", quantity: 50, occurred_at: Time.current, session_id: "other-session")

      get "/api/v1/activities/#{activity.id}", headers: headers

      expect(response).to have_http_status(:not_found)
    end

    it "returns 404 for non-existent activity" do
      get "/api/v1/activities/999999", headers: headers

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /api/v1/activities" do
    it "creates a new activity with session_id" do
      params = {
        activity: {
          activity_type: "electricity",
          description: "Monthly usage",
          quantity: 300,
          occurred_at: Time.current
        }
      }

      expect {
        post "/api/v1/activities", params: params, headers: headers
      }.to change(Activity, :count).by(1)

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json["activity_type"]).to eq("electricity")
      expect(json["emission_kg"].to_f).to eq(126.0) # 300 * 0.42
      expect(Activity.last.session_id).to eq(session_id)
    end

    it "returns errors for invalid data" do
      params = { activity: { activity_type: "invalid_type", quantity: -5 } }

      post "/api/v1/activities", params: params, headers: headers

      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["errors"]).to be_present
    end
  end

  describe "PATCH /api/v1/activities/:id" do
    it "updates an activity" do
      activity = Activity.create!(activity_type: "driving", quantity: 50, occurred_at: Time.current, session_id: session_id)

      patch "/api/v1/activities/#{activity.id}", params: { activity: { quantity: 100 } }, headers: headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["quantity"].to_f).to eq(100.0)
      expect(json["emission_kg"].to_f).to eq(21.0) # 100 * 0.21
    end

    it "returns 404 for activity belonging to another session" do
      activity = Activity.create!(activity_type: "driving", quantity: 50, occurred_at: Time.current, session_id: "other-session")

      patch "/api/v1/activities/#{activity.id}", params: { activity: { quantity: 100 } }, headers: headers

      expect(response).to have_http_status(:not_found)
    end

    it "returns errors for invalid update data" do
      activity = Activity.create!(activity_type: "driving", quantity: 50, occurred_at: Time.current, session_id: session_id)

      patch "/api/v1/activities/#{activity.id}", params: { activity: { quantity: -10 } }, headers: headers

      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["errors"]).to be_present
    end
  end

  describe "DELETE /api/v1/activities/:id" do
    it "deletes an activity" do
      activity = Activity.create!(activity_type: "driving", quantity: 50, occurred_at: Time.current, session_id: session_id)

      expect {
        delete "/api/v1/activities/#{activity.id}", headers: headers
      }.to change(Activity, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end

    it "returns 404 for activity belonging to another session" do
      activity = Activity.create!(activity_type: "driving", quantity: 50, occurred_at: Time.current, session_id: "other-session")

      expect {
        delete "/api/v1/activities/#{activity.id}", headers: headers
      }.not_to change(Activity, :count)

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "GET /api/v1/emission_factors" do
    it "returns all emission factors" do
      get "/api/v1/emission_factors"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.keys).to include("driving", "flight", "electricity")
    end
  end
end
