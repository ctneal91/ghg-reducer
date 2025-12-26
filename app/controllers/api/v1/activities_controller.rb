module Api
  module V1
    class ActivitiesController < ApplicationController
      before_action :set_activity, only: [:show, :update, :destroy]

      def index
        @activities = Activity.order(occurred_at: :desc)
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

      def set_activity
        @activity = Activity.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Activity not found" }, status: :not_found
      end

      def activity_params
        params.require(:activity).permit(:activity_type, :description, :quantity, :occurred_at)
      end
    end
  end
end
