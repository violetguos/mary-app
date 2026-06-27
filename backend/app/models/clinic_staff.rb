class ClinicStaff < ApplicationRecord
  self.table_name = "clinic_staff"
  belongs_to :user
  belongs_to :clinic
end
