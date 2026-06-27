class ServicePractitioner < ApplicationRecord
  belongs_to :service
  belongs_to :practitioner_profile
end
