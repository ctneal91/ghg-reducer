require "rails_helper"

RSpec.describe "Frontend", type: :request do
  describe "GET /" do
    before do
      # Create a minimal index.html for testing
      FileUtils.mkdir_p(Rails.public_path)
      File.write(Rails.public_path.join("index.html"), "<html><body>React App</body></html>")
    end

    after do
      File.delete(Rails.public_path.join("index.html")) if File.exist?(Rails.public_path.join("index.html"))
    end

    it "serves the React app via FrontendController" do
      get "/"

      expect(response).to have_http_status(:ok)
      expect(response.body).to include("React App")
    end

    it "serves React app for catch-all route" do
      get "/some/random/path"

      expect(response).to have_http_status(:ok)
      expect(response.body).to include("React App")
    end
  end
end
