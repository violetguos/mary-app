module Types
  class UserType < Types::BaseObject
    field :id, ID, null: false
    field :email, String, null: false
    field :role, String, null: false
    field :patient_profile, Types::PatientProfileType, null: true
    field :clinic_staff, Types::ClinicStaffType, null: true
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
