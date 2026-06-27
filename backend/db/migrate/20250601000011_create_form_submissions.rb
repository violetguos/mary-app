class CreateFormSubmissions < ActiveRecord::Migration[8.1]
  def change
    create_table :form_submissions do |t|
      t.references :patient, null: false, foreign_key: { to_table: :users }
      t.references :clinic, null: false, foreign_key: true
      t.references :form_template, null: false, foreign_key: true
      t.json :answers, null: false
      t.datetime :signed_at
      t.string :ip_address
      t.timestamps
    end
  end
end
