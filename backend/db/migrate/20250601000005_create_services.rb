class CreateServices < ActiveRecord::Migration[8.1]
  def change
    create_table :services do |t|
      t.references :clinic, null: false, foreign_key: true
      t.string :name, null: false
      t.integer :duration_minutes, null: false
      t.integer :price_cents, null: false, default: 0
      t.string :category
      t.timestamps
    end
  end
end
