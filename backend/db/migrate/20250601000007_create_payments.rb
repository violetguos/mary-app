class CreatePayments < ActiveRecord::Migration[8.1]
  def change
    create_table :payments do |t|
      t.references :appointment, null: false, foreign_key: true
      t.references :patient, null: false, foreign_key: { to_table: :users }
      t.integer :amount_cents, null: false
      t.string :method, null: false
      t.string :status, null: false, default: "pending"
      t.string :processor_transaction_id
      t.datetime :captured_at
      t.timestamps
    end
  end
end
