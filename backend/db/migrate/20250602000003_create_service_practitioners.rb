class CreateServicePractitioners < ActiveRecord::Migration[8.1]
  def change
    create_table :service_practitioners do |t|
      t.references :service, null: false, foreign_key: true
      t.references :practitioner_profile, null: false, foreign_key: true
      t.timestamps
    end
    add_index :service_practitioners, [:service_id, :practitioner_profile_id], unique: true, name: "idx_service_practitioners_unique"
  end
end
