class AddEmissionSourceToActivities < ActiveRecord::Migration[8.1]
  def change
    add_column :activities, :emission_source, :string, default: "local"
  end
end
