require "test_helper"

module Mutations
  class UpdatePatientInsuranceTest < ActiveSupport::TestCase
    setup do
      @patient = users(:patient)
    end

    def execute_update(insurer: nil, plan_number: nil, member_id: nil, user: @patient)
      variables = { insurer: insurer, planNumber: plan_number, memberId: member_id }.compact
      BackendSchema.execute(<<~GRAPHQL, context: { current_user: user }, variables: variables)
        mutation UpdatePatientInsurance($insurer: String, $planNumber: String, $memberId: String) {
          updatePatientInsurance(input: {insurer: $insurer, planNumber: $planNumber, memberId: $memberId}) {
            patientProfile { id insurer planNumber memberId }
            errors
          }
        }
      GRAPHQL
    end

    test "updates insurance info" do
      result = execute_update(insurer: "Manulife", plan_number: "MN-999", member_id: "MEM-888")
      data = result["data"]["updatePatientInsurance"]

      assert_equal [], data["errors"]
      assert_equal "Manulife", data["patientProfile"]["insurer"]
      assert_equal "MN-999", data["patientProfile"]["planNumber"]
      assert_equal "MEM-888", data["patientProfile"]["memberId"]
    end

    test "rejects update when not authenticated" do
      result = execute_update(insurer: "Manulife", user: nil)
      data = result["data"]["updatePatientInsurance"]

      assert data["errors"].any? { |e| e.downcase.include?("authenticated") }
      assert_nil data["patientProfile"]
    end

    test "updates only provided fields" do
      result = execute_update(insurer: "GreenShield")
      data = result["data"]["updatePatientInsurance"]

      assert_equal [], data["errors"]
      assert_equal "GreenShield", data["patientProfile"]["insurer"]
      assert_equal "PL-12345", data["patientProfile"]["planNumber"]
      assert_equal "MEM-001", data["patientProfile"]["memberId"]
    end
  end
end
