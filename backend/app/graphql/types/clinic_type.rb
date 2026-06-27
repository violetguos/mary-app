module Types
  class ClinicType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :subdomain, String, null: false
    field :address, String, null: true
    field :phone, String, null: true
    field :email, String, null: true
    field :services, [Types::ServiceType], null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
