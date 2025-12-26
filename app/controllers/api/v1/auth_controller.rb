module Api
  module V1
    class AuthController < ApplicationController
      before_action :require_auth, only: %i[me claim]

      def signup
        user = User.new(user_params)

        if user.save
          token = encode_token(user_id: user.id)
          render json: { user: user_response(user), token: token }, status: :created
        else
          render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def login
        user = User.find_by(email: params[:email]&.downcase)

        if user&.authenticate(params[:password])
          token = encode_token(user_id: user.id)
          render json: { user: user_response(user), token: token }
        else
          render json: { error: "Invalid email or password" }, status: :unauthorized
        end
      end

      def logout
        head :no_content
      end

      def me
        render json: { user: user_response(current_user) }
      end

      def claim
        claimed_session_id = params[:session_id]
        return render json: { error: "Session ID required" }, status: :bad_request unless claimed_session_id

        claimed_count = Activity.where(session_id: claimed_session_id, user_id: nil)
                                .update_all(user_id: current_user.id, session_id: nil)

        render json: { claimed_count: claimed_count }
      end

      private

      def user_params
        params.permit(:email, :password, :name)
      end

      def user_response(user)
        {
          id: user.id,
          email: user.email,
          name: user.name
        }
      end
    end
  end
end
