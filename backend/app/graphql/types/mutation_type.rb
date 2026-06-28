module Types
  class MutationType < Types::BaseObject
    field :login, mutation: Mutations::Login
    field :signup, mutation: Mutations::Signup
    field :logout, mutation: Mutations::Logout
    field :book_appointment, mutation: Mutations::BookAppointment
  end
end
