module Types
  class ServiceType < Types::BaseObject
    field :id, ID, null: false
    field :clinic_id, ID, null: false
    field :name, String, null: false
    field :duration_minutes, Integer, null: false
    field :price_cents, Integer, null: false
    field :category, String, null: true
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
