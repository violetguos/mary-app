require "test_helper"

class SlotServiceTest < ActiveSupport::TestCase
  setup do
    travel_to Time.zone.parse("2026-06-29 06:00")
    @clinic = clinics(:default)
    @service = services(:rmt)
    @practitioner = practitioner_profiles(:sarah)
  end

  teardown do
    travel_back
  end

  test "generates slots only on scheduled days" do
    # Sunday (day 0) — practitioner has Mon-Fri only
    sunday = Date.parse("2026-06-28")
    slots = SlotService.available_slots(
      practitioner_profile: @practitioner,
      service: @service,
      date: sunday,
    )
    assert slots.empty?, "expected no slots on Sunday"
  end

  test "generates slots within availability hours" do
    monday = Date.parse("2026-06-29")
    slots = SlotService.available_slots(
      practitioner_profile: @practitioner,
      service: @service,
      date: monday,
    )

    refute slots.empty?, "expected slots on Monday"

    first_start = slots.first[:start_at]
    last_start = slots.last[:start_at]

    # RMT is 60 min, schedule is 09:00-17:00
    assert_equal "09:00", first_start.strftime("%H:%M")
    # Last 60-min slot should start at 16:00 (to end at 17:00)
    assert_equal "16:00", last_start.strftime("%H:%M")
  end

  test "45-min booking blocks overlapping 15-min slots" do
    practitioner = practitioner_profiles(:marcus)  # offers 45-min Physio Assessment
    service = services(:physio_assessment)          # 45 min
    monday = Date.parse("2026-06-29")

    # Create an appointment from 10:00 to 10:45
    Appointment.create!(
      patient: users(:patient),
      clinic: @clinic,
      service: service,
      staff: practitioner.user,
      starts_at: Time.zone.parse("2026-06-29 10:00"),
      ends_at: Time.zone.parse("2026-06-29 10:45"),
      status: "scheduled",
    )

    slots = SlotService.available_slots(
      practitioner_profile: practitioner,
      service: service,
      date: monday,
    )

    # Slot at 10:00-10:45 should be unavailable (same as booked)
    slot_1000 = slots.find { |s| s[:start_at].strftime("%H:%M") == "10:00" }
    refute slot_1000[:available], "10:00 slot should be unavailable (direct overlap)"

    # Slot at 10:15-11:00 should be unavailable (overlaps 10:00-10:45)
    slot_1015 = slots.find { |s| s[:start_at].strftime("%H:%M") == "10:15" }
    refute slot_1015[:available], "10:15 slot should be unavailable (overlaps booked 10:00-10:45)"

    # Slot at 10:30-11:15 should be unavailable (overlaps 10:00-10:45)
    slot_1030 = slots.find { |s| s[:start_at].strftime("%H:%M") == "10:30" }
    refute slot_1030[:available], "10:30 slot should be unavailable (overlaps booked 10:00-10:45)"

    # Slot at 10:45-11:30 should be available (starts exactly when booked ends)
    slot_1045 = slots.find { |s| s[:start_at].strftime("%H:%M") == "10:45" }
    assert slot_1045[:available], "10:45 slot should be available (starts at booked end)"
  end

  test "multiple bookings block multiple slot groups" do
    practitioner = practitioner_profiles(:marcus)
    service = services(:physio_assessment)
    monday = Date.parse("2026-06-29")

    # Two 45-min bookings: 09:00-09:45 and 13:00-13:45
    Appointment.create!(
      patient: users(:patient), clinic: @clinic, service: service,
      staff: practitioner.user,
      starts_at: Time.zone.parse("2026-06-29 09:00"),
      ends_at: Time.zone.parse("2026-06-29 09:45"),
      status: "scheduled",
    )
    Appointment.create!(
      patient: users(:patient), clinic: @clinic, service: service,
      staff: practitioner.user,
      starts_at: Time.zone.parse("2026-06-29 13:00"),
      ends_at: Time.zone.parse("2026-06-29 13:45"),
      status: "scheduled",
    )

    slots = SlotService.available_slots(
      practitioner_profile: practitioner,
      service: service,
      date: monday,
    )

    # 09:00 block should be unavailable
    refute slots.find { |s| s[:start_at].strftime("%H:%M") == "09:00" }[:available]
    refute slots.find { |s| s[:start_at].strftime("%H:%M") == "09:15" }[:available]
    refute slots.find { |s| s[:start_at].strftime("%H:%M") == "09:30" }[:available]
    # 09:45 should be available
    assert slots.find { |s| s[:start_at].strftime("%H:%M") == "09:45" }[:available]

    # 13:00 block should be unavailable
    refute slots.find { |s| s[:start_at].strftime("%H:%M") == "13:00" }[:available]
    refute slots.find { |s| s[:start_at].strftime("%H:%M") == "13:15" }[:available]
    refute slots.find { |s| s[:start_at].strftime("%H:%M") == "13:30" }[:available]
    # 13:45 should be available
    assert slots.find { |s| s[:start_at].strftime("%H:%M") == "13:45" }[:available]

    # Middle-of-day slots (10:45-12:45) should be available
    assert slots.find { |s| s[:start_at].strftime("%H:%M") == "11:00" }[:available]
  end

  test "cancelled appointments do not block slots" do
    practitioner = practitioner_profiles(:marcus)
    service = services(:physio_assessment)
    monday = Date.parse("2026-06-29")

    Appointment.create!(
      patient: users(:patient), clinic: @clinic, service: service,
      staff: practitioner.user,
      starts_at: Time.zone.parse("2026-06-29 10:00"),
      ends_at: Time.zone.parse("2026-06-29 10:45"),
      status: "cancelled",
    )

    slots = SlotService.available_slots(
      practitioner_profile: practitioner,
      service: service,
      date: monday,
    )

    slot_1000 = slots.find { |s| s[:start_at].strftime("%H:%M") == "10:00" }
    assert slot_1000[:available], "slot should be available when appointment is cancelled"
  end

  test "60-min slots with 45-min booking blocks properly" do
    # RMT is 60 min. A 45-min physio booking at 10:00-10:45.
    physio = services(:physio_assessment)
    rmt = services(:rmt)

    Appointment.create!(
      patient: users(:patient), clinic: @clinic, service: physio,
      staff: @practitioner.user,
      starts_at: Time.zone.parse("2026-06-29 10:00"),
      ends_at: Time.zone.parse("2026-06-29 10:45"),
      status: "scheduled",
    )

    # Query 60-min RMT slots
    slots = SlotService.available_slots(
      practitioner_profile: @practitioner,
      service: rmt,
      date: Date.parse("2026-06-29"),
    )

    # 09:00-10:00: no overlap → available
    assert slots.find { |s| s[:start_at].strftime("%H:%M") == "09:00" }[:available]

    # 10:00-11:00: overlaps with 10:00-10:45 → unavailable
    refute slots.find { |s| s[:start_at].strftime("%H:%M") == "10:00" }[:available]

    # 10:15-11:15: overlaps with 10:00-10:45 → unavailable
    refute slots.find { |s| s[:start_at].strftime("%H:%M") == "10:15" }[:available]

    # 10:30-11:30: overlaps with 10:00-10:45 → unavailable
    refute slots.find { |s| s[:start_at].strftime("%H:%M") == "10:30" }[:available]

    # 10:45-11:45: starts at booked end → available
    assert slots.find { |s| s[:start_at].strftime("%H:%M") == "10:45" }[:available]
  end
end
