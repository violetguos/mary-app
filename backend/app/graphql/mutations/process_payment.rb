module Mutations
  class ProcessPayment < Mutations::BaseMutation
    argument :appointment_id, ID, required: true
    argument :method_type, String, required: true
    argument :payment_method_id, String, required: false

    field :payment, Types::PaymentType, null: true
    field :errors, [String], null: false

    def resolve(appointment_id:, method_type:, payment_method_id: nil)
      user = context[:current_user]
      return { payment: nil, errors: ["Not authenticated"] } unless user
      return { payment: nil, errors: ["Invalid payment method"] } unless %w[credit_card insurance].include?(method_type)

      appointment = Appointment.find_by(id: appointment_id)
      return { payment: nil, errors: ["Appointment not found"] } unless appointment
      return { payment: nil, errors: ["You can only pay for your own appointments"] } unless appointment.patient_id == user.id

      existing = Payment.find_by(appointment_id: appointment.id)
      return { payment: nil, errors: ["Appointment already has a payment"] } if existing

      amount = appointment.service.price_cents
      processor_id = nil
      captured = nil
      status = "pending"

      if method_type == "credit_card"
        return { payment: nil, errors: ["Payment method ID required"] } unless payment_method_id

        if use_real_stripe?
          begin
            intent = ::Stripe::PaymentIntent.create(
              amount: amount,
              currency: "usd",
              payment_method: payment_method_id,
              confirm: true,
              automatic_payment_methods: { enabled: true, allow_redirects: "never" },
            )
            processor_id = intent.id
            captured = Time.current
            status = "captured"
          rescue ::Stripe::StripeError => e
            return { payment: nil, errors: ["Payment failed: #{e.message}"] }
          end
        else
          processor_id = "pi_mock_#{SecureRandom.hex(12)}"
          captured = Time.current
          status = "captured"
        end
      end

      payment = Payment.new(
        patient: user,
        appointment: appointment,
        amount_cents: amount,
        method: method_type,
        status: status,
        processor_transaction_id: processor_id,
        captured_at: captured,
      )

      if method_type == "insurance"
        profile = user.patient_profile
        return { payment: nil, errors: ["No insurance on file"] } unless profile&.insurer.present?

        payment.save!
        InsuranceClaim.create!(
          payment: payment,
          provider_name: profile.insurer,
          policy_number: profile.plan_number || "",
          status: "draft",
        )
        { payment: payment, errors: [] }
      elsif payment.save
        { payment: payment, errors: [] }
      else
        { payment: nil, errors: payment.errors.full_messages }
      end
    end

    private

    def use_real_stripe?
      ENV["STRIPE_MOCK"] == "false" && ::Stripe.api_key.present?
    end
  end
end
