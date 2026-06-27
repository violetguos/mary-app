class CreateFormTemplates < ActiveRecord::Migration[8.1]
  def change
    create_table :form_templates do |t|
      t.references :clinic, null: false, foreign_key: true
      t.string :name, null: false
      t.json :fields, null: false
      t.boolean :required, default: false
      t.boolean :active, default: true
      t.timestamps
    end
  end
end
