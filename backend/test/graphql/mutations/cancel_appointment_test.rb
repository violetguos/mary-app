require "test_helper"

module Mutations
  class CancelAppointmentTest < ActiveSupport::TestCase
    setup do
      @clinic = clinics(:default)
      @service = services(:rmt)
      @practitioner = practitioner_profiles(:sarah)
      @patient = users(:patient)
    end

    def create_appointment(starts_at:, status: "scheduled")
      Appointment.create!(
        patient: @patient,
        clinic: @clinic,
        service: @service,
        staff: @practitioner.user,
        starts_at: starts_at,
        ends_at: starts_at + @service.duration_minutes.minutes,
        status: status,
      )
    end

    def execute_cancel(appointment:, user:, reason: nil)
      variables = { appointmentId: appointment.id.to_s, reason: reason }
      BackendSchema.execute(<<~GRAPHQL, context: { current_user: user }, variables: variables)
        mutation CancelAppointment($appointmentId: ID!, $reason: String) {
          cancelAppointment(input: {appointmentId: $appointmentId, reason: $reason}) {
            appointment { id status cancelledAt cancellationReason }
            errors
          }
        }
      GRAPHQL
    end

    test "cancels a scheduled appointment within window" do
      appointment = create_appointment(starts_at: 30.hours.from_now)
      result = execute_cancel(appointment: appointment, user: @patient)
      data = result["data"]["cancelAppointment"]

      assert_equal [], data["errors"]
      assert_equal "cancelled", data["appointment"]["status"]
      assert_not_nil data["appointment"]["cancelledAt"]
    end

    test "rejects cancellation when appointment is too soon" do
      appointment = create_appointment(starts_at: 12.hours.from_now)
      result = execute_cancel(appointment: appointment, user: @patient)
      data = result["data"]["cancelAppointment"]

      assert data["errors"].any? { |e| e.include?("24 hour") }
      assert_nil data["appointment"]
    end

    test "rejects cancellation when not authenticated" do
      appointment = create_appointment(starts_at: 48.hours.from_now)
      result = execute_cancel(appointment: appointment, user: nil)
      data = result["data"]["cancelAppointment"]

      assert data["errors"].any? { |e| e.downcase.include?("authenticated") }
      assert_nil data["appointment"]
    end

    test "rejects cancellation by another user" do
      appointment = create_appointment(starts_at: 48.hours.from_now)
      other_user = users(:marcus)
      result = execute_cancel(appointment: appointment, user: other_user)
      data = result["data"]["cancelAppointment"]

      assert data["errors"].any? { |e| e.include?("your own") }
      assert_nil data["appointment"]
    end

    test "rejects cancellation of completed appointment" do
      appointment = create_appointment(starts_at: 48.hours.from_now, status: "completed")
      result = execute_cancel(appointment: appointment, user: @patient)
      data = result["data"]["cancelAppointment"]

      assert data["errors"].any? { |e| e.include?("cannot be cancelled") }
      assert_nil data["appointment"]
    end

    test "stores cancellation reason" do
      appointment = create_appointment(starts_at: 30.hours.from_now)
      result = execute_cancel(appointment: appointment, user: @patient, reason: "Scheduling conflict")
      data = result["data"]["cancelAppointment"]

      assert_equal [], data["errors"]
      assert_equal "Scheduling conflict", data["appointment"]["cancellationReason"]
    end

    test "cancellation is allowed when window is zero" do
      @clinic.update!(cancellation_window_hours: 0)
      appointment = create_appointment(starts_at: 1.hour.from_now)
      result = execute_cancel(appointment: appointment, user: @patient)
      data = result["data"]["cancelAppointment"]

      assert_equal [], data["errors"]
      assert_equal "cancelled", data["appointment"]["status"]
    end

    test "returns error for non-existent appointment" do
      result = BackendSchema.execute(<<~GRAPHQL, context: { current_user: @patient }, variables: { appointmentId: "999999" })
        mutation CancelAppointment($appointmentId: ID!) {
          cancelAppointment(input: {appointmentId: $appointmentId}) {
            appointment { id }
            errors
          }
        }
      GRAPHQL
      data = result["data"]["cancelAppointment"]
      assert data["errors"].any? { |e| e.include?("not found") }
      assert_nil data["appointment"]
    end
  end
end
