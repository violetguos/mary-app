class CreateScheduleAvailabilities < ActiveRecord::Migration[8.1]
  def change
    create_table :schedule_availabilities do |t|
      t.references :practitioner_profile, null: false, foreign_key: true
      t.integer :day_of_week, null: false
      t.time :start_time, null: false
      t.time :end_time, null: false
      t.timestamps
    end
    add_index :schedule_availabilities, :day_of_week
  end
end
