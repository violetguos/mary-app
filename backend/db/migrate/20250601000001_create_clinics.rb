class CreateClinics < ActiveRecord::Migration[8.1]
  def change
    create_table :clinics do |t|
      t.string :name, null: false
      t.string :subdomain, null: false
      t.string :address
      t.string :phone
      t.string :email
      t.timestamps
    end
    add_index :clinics, :subdomain, unique: true
  end
end
