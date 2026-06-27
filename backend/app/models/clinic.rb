class Clinic < ApplicationRecord
  has_many :patient_profiles, dependent: :destroy
  has_many :clinic_staff, dependent: :destroy
  has_many :services, dependent: :destroy
  has_many :appointments, dependent: :destroy
  has_many :form_templates, dependent: :destroy
  has_many :form_submissions, dependent: :destroy

  validates :name, presence: true
  validates :subdomain, presence: true, uniqueness: true
end
