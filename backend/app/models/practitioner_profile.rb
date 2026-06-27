class PractitionerProfile < ApplicationRecord
  belongs_to :user
  belongs_to :clinic
  has_many :schedule_availabilities, dependent: :destroy
  has_many :service_practitioners, dependent: :destroy
  has_many :services, through: :service_practitioners

  validates :bio, presence: true, allow_blank: true
end
