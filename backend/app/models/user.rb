class User < ApplicationRecord
  has_secure_password
  has_secure_token :auth_token

  has_one :patient_profile, dependent: :destroy
  has_one :clinic_staff, dependent: :destroy

  has_many :appointments_as_patient, class_name: "Appointment", foreign_key: :patient_id, dependent: :destroy
  has_many :appointments_as_staff, class_name: "Appointment", foreign_key: :staff_id, dependent: :nullify
  has_many :payments_as_patient, class_name: "Payment", foreign_key: :patient_id, dependent: :destroy
  has_many :form_submissions, foreign_key: :patient_id, dependent: :destroy
  has_many :audit_logs, foreign_key: :actor_id, dependent: :nullify

  validates :email, presence: true, uniqueness: true,
            format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :role, presence: true, inclusion: { in: %w[patient clinic_admin super_admin] }

  def patient?
    role == "patient"
  end

  def clinic_admin?
    role == "clinic_admin"
  end
end
