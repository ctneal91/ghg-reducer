class AddUserAndSessionToActivities < ActiveRecord::Migration[8.1]
  def change
    add_reference :activities, :user, null: true, foreign_key: true
    add_column :activities, :session_id, :string
    add_index :activities, :session_id
  end
end
