class ApplicationController < ActionController::API
  private

  def current_user
    @current_user ||= User.find_by(id: decoded_token["user_id"]) if decoded_token
  end

  def session_id
    request.headers["X-Session-Id"]
  end

  def user_region
    region = request.headers["X-User-Region"]&.upcase
    return "US" unless region.present?

    # Validate against Climatiq supported regions
    valid_regions = %w[US GB DE FR AU CA JP CN IN BR ES IT NL BE AT CH SE NO DK FI PL PT IE NZ SG HK KR TW MX AR CL CO ZA]
    valid_regions.include?(region) ? region : "US"
  end

  def decoded_token
    token = request.headers["Authorization"]&.split(" ")&.last
    return nil unless token

    JWT.decode(token, jwt_secret, true, algorithm: "HS256").first
  rescue JWT::DecodeError
    nil
  end

  def jwt_secret
    Rails.application.credentials.secret_key_base || ENV.fetch("SECRET_KEY_BASE", "dev-secret")
  end

  def encode_token(payload)
    JWT.encode(payload.merge(exp: 24.hours.from_now.to_i), jwt_secret, "HS256")
  end

  def require_auth
    render json: { error: "Unauthorized" }, status: :unauthorized unless current_user
  end
end
