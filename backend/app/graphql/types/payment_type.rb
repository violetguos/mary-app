module Types
  class PaymentType < Types::BaseObject
    field :id, ID, null: false
    field :appointment, Types::AppointmentType, null: false
    field :patient, Types::UserType, null: false
    field :amount_cents, Integer, null: false
    field :payment_method, String, null: false, method: :method
    field :status, String, null: false
    field :processor_transaction_id, String, null: true
    field :captured_at, GraphQL::Types::ISO8601DateTime, null: true
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
