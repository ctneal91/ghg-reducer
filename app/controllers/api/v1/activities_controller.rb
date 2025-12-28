module Api
  module V1
    class ActivitiesController < ApplicationController
      before_action :set_activity, only: %i[show update destroy]

      def index
        @activities = scoped_activities.order(occurred_at: :desc)
        render json: {
          activities: @activities,
          summary: {
            total_emissions_kg: @activities.sum(:emission_kg).round(2),
            activity_count: @activities.count
          }
        }
      end

      def show
        render json: @activity
      end

      def create
        @activity = Activity.new(activity_params)
        @activity.user = current_user
        @activity.session_id = session_id unless current_user
        @activity.region = user_region

        if @activity.save
          render json: @activity, status: :created
        else
          render json: { errors: @activity.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @activity.update(activity_params)
          render json: @activity
        else
          render json: { errors: @activity.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @activity.destroy
        head :no_content
      end

      def emission_factors
        render json: Activity::EMISSION_FACTORS
      end

      private

      def scoped_activities
        if current_user
          Activity.where(user_id: current_user.id)
        elsif session_id.present?
          Activity.where(session_id: session_id)
        else
          Activity.none
        end
      end

      def set_activity
        @activity = scoped_activities.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Activity not found" }, status: :not_found
      end

      def activity_params
        params.require(:activity).permit(:activity_type, :description, :quantity, :occurred_at)
      end
    end
  end
end
