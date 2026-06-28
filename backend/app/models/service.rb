class Service < ApplicationRecord
  belongs_to :clinic
  has_many :appointments, dependent: :restrict_with_error
  has_many :service_practitioners, dependent: :destroy
  has_many :practitioner_profiles, through: :service_practitioners

  validates :name, presence: true
  validates :duration_minutes, presence: true, numericality: { greater_than: 0 }
  validates :price_cents, numericality: { greater_than_or_equal_to: 0 }

  CATEGORIES = %w[rmt physio psych naturopath beauty].freeze
  validates :category, inclusion: { in: CATEGORIES }, allow_blank: true
end
