module Mutations
  class BookAppointment < Mutations::BaseMutation
    argument :practitioner_profile_id, ID, required: true
    argument :service_id, ID, required: true
    argument :starts_at, GraphQL::Types::ISO8601DateTime, required: true

    field :appointment, Types::AppointmentType, null: true
    field :errors, [String], null: false

    def resolve(practitioner_profile_id:, service_id:, starts_at:)
      user = context[:current_user]
      return { appointment: nil, errors: ["Not authenticated"] } unless user

      practitioner = PractitionerProfile.find(practitioner_profile_id)
      service = Service.find(service_id)
      ends_at = starts_at + service.duration_minutes.minutes

      appointment = Appointment.new(
        patient: user,
        clinic: practitioner.clinic,
        service: service,
        staff: practitioner.user,
        starts_at: starts_at,
        ends_at: ends_at,
        status: "scheduled",
      )

      if appointment.save
        { appointment: appointment, errors: [] }
      else
        { appointment: nil, errors: appointment.errors.full_messages }
      end
    end
  end
end
