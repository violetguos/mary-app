class SlotService
  SLOT_INTERVAL = 15

  def self.available_slots(practitioner_profile:, service:, date:)
    availabilities = practitioner_profile.schedule_availabilities.where(day_of_week: date.wday)
    return [] if availabilities.empty?

    existing = Appointment
      .where(staff_id: practitioner_profile.user_id)
      .where("date(starts_at) = ?", date)
      .where.not(status: %w[cancelled no_show])
      .order(:starts_at)

    slots = []
    duration = service.duration_minutes

    availabilities.each do |avail|
      current = avail.start_time
      while current + duration.minutes <= avail.end_time
        slot_start = Time.zone.parse("#{date.iso8601} #{current.strftime('%H:%M')}")
        slot_end = slot_start + duration.minutes

        overlaps = existing.any? do |appt|
          slot_start < appt.ends_at && slot_end > appt.starts_at
        end

        slots << {
          start_at: slot_start,
          end_at: slot_end,
          available: !overlaps && slot_start > Time.current,
        }

        current += SLOT_INTERVAL.minutes
      end
    end

    slots
  end
end
