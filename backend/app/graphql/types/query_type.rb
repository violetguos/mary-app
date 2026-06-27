module Types
  class QueryType < Types::BaseObject
    field :node, Types::NodeType, null: true, description: "Fetches an object given its ID." do
      argument :id, ID, required: true, description: "ID of the object."
    end

    def node(id:)
      context.schema.object_from_id(id, context)
    end

    field :nodes, [Types::NodeType, null: true], null: true, description: "Fetches a list of objects given a list of IDs." do
      argument :ids, [ID], required: true, description: "IDs of the objects."
    end

    def nodes(ids:)
      ids.map { |id| context.schema.object_from_id(id, context) }
    end

    field :me, Types::UserType, null: true

    def me
      context[:current_user]
    end

    field :clinics, [Types::ClinicType], null: false

    def clinics
      Clinic.all
    end

    field :clinic, Types::ClinicType, null: true do
      argument :id, ID, required: true
    end

    def clinic(id:)
      Clinic.find_by(id: id)
    end

    field :services, [Types::ServiceType], null: false

    def services
      Service.all
    end

    field :practitioners, [Types::PractitionerProfileType], null: false do
      argument :clinic_id, ID, required: true
    end

    def practitioners(clinic_id:)
      PractitionerProfile.where(clinic_id: clinic_id).includes(:user, :services, :schedule_availabilities)
    end

    field :available_slots, [Types::TimeSlotType], null: false do
      argument :practitioner_profile_id, ID, required: true
      argument :service_id, ID, required: true
      argument :date, GraphQL::Types::ISO8601Date, required: true
    end

    def available_slots(practitioner_profile_id:, service_id:, date:)
      practitioner = PractitionerProfile.find(practitioner_profile_id)
      service = Service.find(service_id)
      duration = service.duration_minutes

      availabilities = practitioner.schedule_availabilities.where(day_of_week: date.wday)

      existing = Appointment
        .where(staff_id: practitioner.user_id)
        .where("date(starts_at) = ?", date)
        .where.not(status: %w[cancelled no_show])
        .order(:starts_at)

      slots = []
      slot_interval = 15

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

          current += slot_interval.minutes
        end
      end

      slots
    end
  end
end
