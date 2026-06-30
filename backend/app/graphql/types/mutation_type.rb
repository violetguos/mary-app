module Types
  class MutationType < Types::BaseObject
    field :login, mutation: Mutations::Login
    field :signup, mutation: Mutations::Signup
    field :logout, mutation: Mutations::Logout
    field :book_appointment, mutation: Mutations::BookAppointment
    field :cancel_appointment, mutation: Mutations::CancelAppointment
    field :update_clinic, mutation: Mutations::UpdateClinic
    field :process_payment, mutation: Mutations::ProcessPayment
    field :update_patient_insurance, mutation: Mutations::UpdatePatientInsurance
  end
end
