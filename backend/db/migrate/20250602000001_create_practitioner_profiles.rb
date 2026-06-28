class CreatePractitionerProfiles < ActiveRecord::Migration[8.1]
  def change
    create_table :practitioner_profiles do |t|
      t.references :user, null: false, foreign_key: true
      t.references :clinic, null: false, foreign_key: true
      t.text :bio
      t.string :photo_url
      t.integer :years_experience
      t.timestamps
    end
  end
end
