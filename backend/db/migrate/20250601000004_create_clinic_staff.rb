class CreateClinicStaff < ActiveRecord::Migration[8.1]
  def change
    create_table :clinic_staff do |t|
      t.references :user, null: false, foreign_key: true
      t.references :clinic, null: false, foreign_key: true
      t.json :permissions
      t.timestamps
    end
  end
end
