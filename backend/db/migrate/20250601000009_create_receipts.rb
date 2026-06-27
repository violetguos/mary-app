class CreateReceipts < ActiveRecord::Migration[8.1]
  def change
    create_table :receipts do |t|
      t.references :payment, null: false, foreign_key: true
      t.string :receipt_number, null: false
      t.datetime :issued_at
      t.timestamps
    end
    add_index :receipts, :receipt_number, unique: true
  end
end
