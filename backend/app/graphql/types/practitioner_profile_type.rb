module Types
  class PractitionerProfileType < Types::BaseObject
    field :id, ID, null: false
    field :user, Types::UserType, null: false
    field :clinic, Types::ClinicType, null: false
    field :bio, String, null: true
    field :photo_url, String, null: true
    field :years_experience, Integer, null: true
    field :services, [Types::ServiceType], null: false
    field :schedule_availabilities, [Types::ScheduleAvailabilityType], null: false
  end
end
