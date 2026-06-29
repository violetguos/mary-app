class AddCancellationWindowHoursToClinics < ActiveRecord::Migration[8.1]
  def change
    add_column :clinics, :cancellation_window_hours, :integer, default: 24, null: false
  end
end
