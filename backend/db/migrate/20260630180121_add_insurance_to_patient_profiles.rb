class AddInsuranceToPatientProfiles < ActiveRecord::Migration[8.1]
  def change
    add_column :patient_profiles, :insurer, :string
    add_column :patient_profiles, :plan_number, :string
    add_column :patient_profiles, :member_id, :string
  end
end
