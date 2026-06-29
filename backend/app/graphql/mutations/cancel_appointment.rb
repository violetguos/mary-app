module Mutations
  class CancelAppointment < Mutations::BaseMutation
    argument :appointment_id, ID, required: true
    argument :reason, String, required: false

    field :appointment, Types::AppointmentType, null: true
    field :errors, [String], null: false

    def resolve(appointment_id:, reason: nil)
      user = context[:current_user]
      return { appointment: nil, errors: ["Not authenticated"] } unless user

      appointment = Appointment.find_by(id: appointment_id)
      return { appointment: nil, errors: ["Appointment not found"] } unless appointment
      return { appointment: nil, errors: ["You can only cancel your own appointments"] } unless appointment.patient_id == user.id
      return { appointment: nil, errors: ["Appointment cannot be cancelled (status: #{appointment.status})"] } unless %w[scheduled confirmed].include?(appointment.status)

      clinic = appointment.clinic
      window_hours = clinic.cancellation_window_hours

      if window_hours > 0 && appointment.starts_at <= Time.current + window_hours.hours
        return { appointment: nil, errors: ["Cancellation must be made at least #{window_hours} hour#{window_hours == 1 ? '' : 's'} before the appointment"] }
      end

      appointment.update!(
        status: "cancelled",
        cancelled_at: Time.current,
        cancelled_by_id: user.id,
        cancellation_reason: reason,
      )

      { appointment: appointment, errors: [] }
    end
  end
end
