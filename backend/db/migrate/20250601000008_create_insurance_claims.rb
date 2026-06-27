class CreateInsuranceClaims < ActiveRecord::Migration[8.1]
  def change
    create_table :insurance_claims do |t|
      t.references :payment, null: false, foreign_key: true
      t.string :policy_number, null: false
      t.string :provider_name, null: false
      t.string :status, null: false, default: "draft"
      t.datetime :submitted_at
      t.json :response_payload
      t.timestamps
    end
  end
end
