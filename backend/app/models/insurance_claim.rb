class InsuranceClaim < ApplicationRecord
  belongs_to :payment

  validates :policy_number, :provider_name, presence: true
  validates :status, presence: true,
            inclusion: { in: %w[draft submitted approved denied] }
end
