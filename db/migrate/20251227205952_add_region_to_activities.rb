class AddRegionToActivities < ActiveRecord::Migration[8.1]
  def change
    add_column :activities, :region, :string, default: "US"
  end
end
