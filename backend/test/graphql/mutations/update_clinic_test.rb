require "test_helper"

module Mutations
  class UpdateClinicTest < ActiveSupport::TestCase
    setup do
      @clinic = clinics(:default)
      @admin = users(:admin)
      @patient = users(:patient)
    end

    def execute_update(clinic_id:, cancellation_window_hours:, user:)
      variables = { clinicId: clinic_id.to_s, cancellationWindowHours: cancellation_window_hours }
      BackendSchema.execute(<<~GRAPHQL, context: { current_user: user }, variables: variables)
        mutation UpdateClinic($clinicId: ID!, $cancellationWindowHours: Int) {
          updateClinic(input: {clinicId: $clinicId, cancellationWindowHours: $cancellationWindowHours}) {
            clinic { id cancellationWindowHours }
            errors
          }
        }
      GRAPHQL
    end

    test "admin can update cancellation window" do
      result = execute_update(clinic_id: @clinic.id, cancellation_window_hours: 48, user: @admin)
      data = result["data"]["updateClinic"]

      assert_equal [], data["errors"]
      assert_equal 48, data["clinic"]["cancellationWindowHours"]
    end

    test "rejects update when not authenticated" do
      result = execute_update(clinic_id: @clinic.id, cancellation_window_hours: 12, user: nil)
      data = result["data"]["updateClinic"]

      assert data["errors"].any? { |e| e.downcase.include?("authenticated") }
      assert_nil data["clinic"]
    end

    test "rejects update by non-admin user" do
      result = execute_update(clinic_id: @clinic.id, cancellation_window_hours: 12, user: @patient)
      data = result["data"]["updateClinic"]

      assert data["errors"].any? { |e| e.include?("clinic admin") }
      assert_nil data["clinic"]
    end
  end
end
