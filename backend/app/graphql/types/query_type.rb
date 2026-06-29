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

    field :my_appointments, [Types::AppointmentType], null: false

    def my_appointments
      user = context[:current_user]
      return [] unless user
      Appointment.where(patient_id: user.id).includes(:clinic, :service, :staff).order(starts_at: :desc)
    end

    field :available_slots, [Types::TimeSlotType], null: false do
      argument :practitioner_profile_id, ID, required: true
      argument :service_id, ID, required: true
      argument :date, GraphQL::Types::ISO8601Date, required: true
    end

    def available_slots(practitioner_profile_id:, service_id:, date:)
      practitioner = PractitionerProfile.find(practitioner_profile_id)
      service = Service.find(service_id)

      SlotService.available_slots(
        practitioner_profile: practitioner,
        service: service,
        date: date,
      )
    end
  end
end
