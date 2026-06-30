module Types
  class InsuranceClaimType < Types::BaseObject
    field :id, ID, null: false
    field :payment, Types::PaymentType, null: false
    field :provider_name, String, null: false
    field :policy_number, String, null: false
    field :status, String, null: false
    field :submitted_at, GraphQL::Types::ISO8601DateTime, null: true
  end
end
