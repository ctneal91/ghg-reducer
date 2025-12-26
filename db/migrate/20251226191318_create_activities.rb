class CreateActivities < ActiveRecord::Migration[8.1]
  def change
    create_table :activities do |t|
      t.string :activity_type
      t.string :description
      t.decimal :quantity
      t.string :unit
      t.decimal :emission_kg
      t.datetime :occurred_at

      t.timestamps
    end
  end
end
