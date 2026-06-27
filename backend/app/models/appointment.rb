class Appointment < ApplicationRecord
  belongs_to :patient, class_name: "User"
  belongs_to :clinic
  belongs_to :service
  belongs_to :staff, class_name: "User", optional: true
  has_many :payments, dependent: :destroy

  validates :starts_at, :ends_at, presence: true
  validates :status, presence: true,
            inclusion: { in: %w[scheduled confirmed cancelled completed no_show] }
end
