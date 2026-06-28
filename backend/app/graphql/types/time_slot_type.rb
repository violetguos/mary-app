module Types
  class TimeSlotType < Types::BaseObject
    field :start_at, GraphQL::Types::ISO8601DateTime, null: false
    field :end_at, GraphQL::Types::ISO8601DateTime, null: false
    field :available, Boolean, null: false
  end
end
