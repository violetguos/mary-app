module Types
  class AppointmentType < Types::BaseObject
    field :id, ID, null: false
    field :patient, Types::UserType, null: false
    field :clinic, Types::ClinicType, null: false
    field :service, Types::ServiceType, null: false
    field :staff, Types::UserType, null: true
    field :starts_at, GraphQL::Types::ISO8601DateTime, null: false
    field :ends_at, GraphQL::Types::ISO8601DateTime, null: false
    field :status, String, null: false
    field :cancelled_at, GraphQL::Types::ISO8601DateTime, null: true
    field :cancellation_reason, String, null: true
    field :late_fee_cents, Integer, null: true
    field :no_show_fee_cents, Integer, null: true
  end
end
