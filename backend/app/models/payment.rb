class Payment < ApplicationRecord
  belongs_to :appointment
  belongs_to :patient, class_name: "User"
  has_one :insurance_claim, dependent: :destroy
  has_one :receipt, dependent: :destroy

  validates :amount_cents, presence: true, numericality: { greater_than: 0 }
  validates :method, presence: true, inclusion: { in: %w[credit_card insurance cash] }
  validates :status, presence: true,
            inclusion: { in: %w[pending captured refunded failed] }
end
