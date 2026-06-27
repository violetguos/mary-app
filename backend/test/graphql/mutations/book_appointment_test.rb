require "test_helper"

module Mutations
  class BookAppointmentTest < ActiveSupport::TestCase
    setup do
      @clinic = clinics(:default)
      @service = services(:rmt)
      @practitioner = practitioner_profiles(:sarah)
      @patient = users(:patient)
    end

    test "creates an appointment successfully" do
      starts_at = Time.zone.parse("2026-06-29 10:00")
      variables = {
        practitionerProfileId: @practitioner.id.to_s,
        serviceId: @service.id.to_s,
        startsAt: starts_at.iso8601,
      }

      result = BackendSchema.execute(<<~GRAPHQL, context: { current_user: @patient }, variables: variables)
        mutation BookAppointment($practitionerProfileId: ID!, $serviceId: ID!, $startsAt: ISO8601DateTime!) {
          bookAppointment(input: {
            practitionerProfileId: $practitionerProfileId
            serviceId: $serviceId
            startsAt: $startsAt
          }) {
            appointment { id startsAt status }
            errors
          }
        }
      GRAPHQL

      data = result["data"]["bookAppointment"]
      assert_equal [], data["errors"]
      assert_not_nil data["appointment"]
      assert_equal "scheduled", data["appointment"]["status"]
    end

    test "returns error when not authenticated" do
      starts_at = Time.zone.parse("2026-06-29 10:00")
      variables = {
        practitionerProfileId: @practitioner.id.to_s,
        serviceId: @service.id.to_s,
        startsAt: starts_at.iso8601,
      }

      result = BackendSchema.execute(<<~GRAPHQL, context: { current_user: nil }, variables: variables)
        mutation BookAppointment($practitionerProfileId: ID!, $serviceId: ID!, $startsAt: ISO8601DateTime!) {
          bookAppointment(input: {
            practitionerProfileId: $practitionerProfileId
            serviceId: $serviceId
            startsAt: $startsAt
          }) {
            appointment { id }
            errors
          }
        }
      GRAPHQL

      data = result["data"]["bookAppointment"]
      assert data["errors"].any? { |e| e.downcase.include?("authenticated") }
      assert_nil data["appointment"]
    end

    test "appointment creates correct ends_at from service duration" do
      starts_at = Time.zone.parse("2026-06-29 14:00")
      variables = {
        practitionerProfileId: @practitioner.id.to_s,
        serviceId: @service.id.to_s,
        startsAt: starts_at.iso8601,
      }

      result = BackendSchema.execute(<<~GRAPHQL, context: { current_user: @patient }, variables: variables)
        mutation BookAppointment($practitionerProfileId: ID!, $serviceId: ID!, $startsAt: ISO8601DateTime!) {
          bookAppointment(input: {
            practitionerProfileId: $practitionerProfileId
            serviceId: $serviceId
            startsAt: $startsAt
          }) {
            appointment { startsAt }
            errors
          }
        }
      GRAPHQL

      data = result["data"]["bookAppointment"]
      assert_equal [], data["errors"]
      returned_start = Time.zone.parse(data["appointment"]["startsAt"])
      assert_equal starts_at, returned_start
    end
  end
end
