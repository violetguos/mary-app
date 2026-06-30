require "test_helper"

module Mutations
  class ProcessPaymentTest < ActiveSupport::TestCase
    setup do
      @clinic = clinics(:default)
      @service = services(:rmt)
      @practitioner = practitioner_profiles(:sarah)
      @patient = users(:patient)
      @appointment = Appointment.create!(
        patient: @patient,
        clinic: @clinic,
        service: @service,
        staff: @practitioner.user,
        starts_at: 48.hours.from_now,
        ends_at: 48.hours.from_now + @service.duration_minutes.minutes,
        status: "scheduled",
      )
    end

    def execute_payment(appointment_id:, method_type:, payment_method_id: nil, user: @patient)
      variables = {
        appointmentId: appointment_id.to_s,
        methodType: method_type,
        paymentMethodId: payment_method_id,
      }.compact
      BackendSchema.execute(<<~GRAPHQL, context: { current_user: user }, variables: variables)
        mutation ProcessPayment($appointmentId: ID!, $methodType: String!, $paymentMethodId: String) {
          processPayment(input: {appointmentId: $appointmentId, methodType: $methodType, paymentMethodId: $paymentMethodId}) {
            payment { id amountCents paymentMethod status processorTransactionId }
            errors
          }
        }
      GRAPHQL
    end

    test "processes insurance payment successfully" do
      result = execute_payment(appointment_id: @appointment.id, method_type: "insurance")
      data = result["data"]["processPayment"]

      assert_equal [], data["errors"]
      assert_equal "insurance", data["payment"]["paymentMethod"]
      assert_equal "pending", data["payment"]["status"]
      assert_equal @service.price_cents, data["payment"]["amountCents"]
    end

    test "rejects payment when not authenticated" do
      result = execute_payment(appointment_id: @appointment.id, method_type: "insurance", user: nil)
      data = result["data"]["processPayment"]

      assert data["errors"].any? { |e| e.downcase.include?("authenticated") }
      assert_nil data["payment"]
    end

    test "rejects payment for another user's appointment" do
      other = users(:marcus)
      result = execute_payment(appointment_id: @appointment.id, method_type: "insurance", user: other)
      data = result["data"]["processPayment"]

      assert data["errors"].any? { |e| e.include?("your own") }
      assert_nil data["payment"]
    end

    test "rejects duplicate payment" do
      execute_payment(appointment_id: @appointment.id, method_type: "insurance")
      result = execute_payment(appointment_id: @appointment.id, method_type: "insurance")
      data = result["data"]["processPayment"]

      assert data["errors"].any? { |e| e.include?("already has a payment") }
    end

    test "rejects credit_card without payment method id" do
      result = execute_payment(appointment_id: @appointment.id, method_type: "credit_card")
      data = result["data"]["processPayment"]

      assert data["errors"].any? { |e| e.include?("Payment method ID required") }
    end

    test "rejects invalid payment method type" do
      result = execute_payment(appointment_id: @appointment.id, method_type: "cash")
      data = result["data"]["processPayment"]

      assert data["errors"].any? { |e| e.include?("Invalid payment method") }
    end

    test "rejects payment for non-existent appointment" do
      result = execute_payment(appointment_id: "999999", method_type: "insurance")
      data = result["data"]["processPayment"]

      assert data["errors"].any? { |e| e.include?("not found") }
      assert_nil data["payment"]
    end

    test "rejects insurance payment when no insurance on file" do
      @patient.patient_profile.update!(insurer: nil, plan_number: nil, member_id: nil)
      result = execute_payment(appointment_id: @appointment.id, method_type: "insurance")
      data = result["data"]["processPayment"]

      assert data["errors"].any? { |e| e.include?("No insurance on file") }
    end

    test "creates insurance claim for insurance payment" do
      result = execute_payment(appointment_id: @appointment.id, method_type: "insurance")
      data = result["data"]["processPayment"]

      payment_id = data["payment"]["id"]
      claim = InsuranceClaim.find_by(payment_id: payment_id)
      assert_not_nil claim
      assert_equal "draft", claim.status
      assert_equal "SunLife", claim.provider_name
    end
  end
end
