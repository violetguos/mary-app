module Types
  class PatientProfileType < Types::BaseObject
    field :id, ID, null: false
    field :first_name, String, null: false
    field :last_name, String, null: false
    field :phone, String, null: true
    field :date_of_birth, GraphQL::Types::ISO8601Date, null: true
    field :clinic, Types::ClinicType, null: false
    field :insurer, String, null: true
    field :plan_number, String, null: true
    field :member_id, String, null: true
  end
end
