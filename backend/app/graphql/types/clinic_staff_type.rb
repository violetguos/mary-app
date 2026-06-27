module Types
  class ClinicStaffType < Types::BaseObject
    field :id, ID, null: false
    field :user, Types::UserType, null: false
    field :clinic, Types::ClinicType, null: false
    field :permissions, GraphQL::Types::JSON, null: true
  end
end
