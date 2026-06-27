class PatientProfile < ApplicationRecord
  belongs_to :user
  belongs_to :clinic

  validates :first_name, :last_name, presence: true
end
