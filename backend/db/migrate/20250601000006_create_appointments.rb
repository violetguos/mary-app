class CreateAppointments < ActiveRecord::Migration[8.1]
  def change
    create_table :appointments do |t|
      t.references :patient, null: false, foreign_key: { to_table: :users }
      t.references :clinic, null: false, foreign_key: true
      t.references :service, null: false, foreign_key: true
      t.references :staff, foreign_key: { to_table: :users }
      t.datetime :starts_at, null: false
      t.datetime :ends_at, null: false
      t.string :status, null: false, default: "scheduled"
      t.datetime :cancelled_at
      t.integer :cancelled_by_id
      t.string :cancellation_reason
      t.integer :late_fee_cents
      t.integer :no_show_fee_cents
      t.timestamps
    end
    add_index :appointments, :status
    add_index :appointments, :starts_at
  end
end
