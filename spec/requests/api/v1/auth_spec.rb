require "rails_helper"

RSpec.describe "Api::V1::Auth", type: :request do
  describe "POST /api/v1/auth/signup" do
    it "creates a new user and returns token" do
      params = { email: "new@example.com", password: "password123", name: "New User" }

      expect {
        post "/api/v1/auth/signup", params: params
      }.to change(User, :count).by(1)

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json["user"]["email"]).to eq("new@example.com")
      expect(json["user"]["name"]).to eq("New User")
      expect(json["token"]).to be_present
    end

    it "returns errors for invalid data" do
      params = { email: "invalid", password: "123", name: "" }

      post "/api/v1/auth/signup", params: params

      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["errors"]).to be_present
    end

    it "returns error for duplicate email" do
      User.create!(email: "existing@example.com", password: "password123", name: "Existing")
      params = { email: "existing@example.com", password: "password123", name: "New User" }

      post "/api/v1/auth/signup", params: params

      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["errors"]).to include("Email has already been taken")
    end
  end

  describe "POST /api/v1/auth/login" do
    let!(:user) { User.create!(email: "user@example.com", password: "password123", name: "Test User") }

    it "returns user and token with valid credentials" do
      post "/api/v1/auth/login", params: { email: "user@example.com", password: "password123" }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["user"]["email"]).to eq("user@example.com")
      expect(json["token"]).to be_present
    end

    it "returns error with invalid password" do
      post "/api/v1/auth/login", params: { email: "user@example.com", password: "wrongpassword" }

      expect(response).to have_http_status(:unauthorized)
      json = JSON.parse(response.body)
      expect(json["error"]).to eq("Invalid email or password")
    end

    it "returns error with non-existent email" do
      post "/api/v1/auth/login", params: { email: "nonexistent@example.com", password: "password123" }

      expect(response).to have_http_status(:unauthorized)
      json = JSON.parse(response.body)
      expect(json["error"]).to eq("Invalid email or password")
    end

    it "handles case-insensitive email" do
      post "/api/v1/auth/login", params: { email: "USER@EXAMPLE.COM", password: "password123" }

      expect(response).to have_http_status(:ok)
    end
  end

  describe "DELETE /api/v1/auth/logout" do
    it "returns no content" do
      delete "/api/v1/auth/logout"

      expect(response).to have_http_status(:no_content)
    end
  end

  describe "GET /api/v1/auth/me" do
    let!(:user) { User.create!(email: "user@example.com", password: "password123", name: "Test User") }

    it "returns current user with valid token" do
      post "/api/v1/auth/login", params: { email: "user@example.com", password: "password123" }
      token = JSON.parse(response.body)["token"]

      get "/api/v1/auth/me", headers: { "Authorization" => "Bearer #{token}" }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["user"]["email"]).to eq("user@example.com")
      expect(json["user"]["name"]).to eq("Test User")
    end

    it "returns unauthorized without token" do
      get "/api/v1/auth/me"

      expect(response).to have_http_status(:unauthorized)
    end

    it "returns unauthorized with invalid token" do
      get "/api/v1/auth/me", headers: { "Authorization" => "Bearer invalid_token" }

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "POST /api/v1/auth/claim" do
    let!(:user) { User.create!(email: "user@example.com", password: "password123", name: "Test User") }
    let(:session_id) { SecureRandom.uuid }

    before do
      Activity.create!(activity_type: "driving", quantity: 100, occurred_at: Time.current, session_id: session_id)
      Activity.create!(activity_type: "flight", quantity: 500, occurred_at: Time.current, session_id: session_id)
    end

    it "claims guest activities for authenticated user" do
      post "/api/v1/auth/login", params: { email: "user@example.com", password: "password123" }
      token = JSON.parse(response.body)["token"]

      post "/api/v1/auth/claim", params: { session_id: session_id }, headers: { "Authorization" => "Bearer #{token}" }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["claimed_count"]).to eq(2)

      expect(Activity.where(user_id: user.id).count).to eq(2)
      expect(Activity.where(session_id: session_id).count).to eq(0)
    end

    it "returns unauthorized without token" do
      post "/api/v1/auth/claim", params: { session_id: session_id }

      expect(response).to have_http_status(:unauthorized)
    end

    it "returns bad request without session_id" do
      post "/api/v1/auth/login", params: { email: "user@example.com", password: "password123" }
      token = JSON.parse(response.body)["token"]

      post "/api/v1/auth/claim", headers: { "Authorization" => "Bearer #{token}" }

      expect(response).to have_http_status(:bad_request)
    end

    it "does not claim activities already belonging to another user" do
      other_user = User.create!(email: "other@example.com", password: "password123", name: "Other User")
      Activity.create!(activity_type: "electricity", quantity: 200, occurred_at: Time.current, user_id: other_user.id)

      post "/api/v1/auth/login", params: { email: "user@example.com", password: "password123" }
      token = JSON.parse(response.body)["token"]

      post "/api/v1/auth/claim", params: { session_id: session_id }, headers: { "Authorization" => "Bearer #{token}" }

      json = JSON.parse(response.body)
      expect(json["claimed_count"]).to eq(2)
      expect(Activity.where(user_id: other_user.id).count).to eq(1)
    end
  end
end
