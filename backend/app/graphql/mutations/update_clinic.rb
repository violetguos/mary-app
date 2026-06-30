module Mutations
  class UpdateClinic < Mutations::BaseMutation
    argument :clinic_id, ID, required: true
    argument :cancellation_window_hours, Integer, required: false

    field :clinic, Types::ClinicType, null: true
    field :errors, [String], null: false

    def resolve(clinic_id:, cancellation_window_hours: nil)
      user = context[:current_user]
      return { clinic: nil, errors: ["Not authenticated"] } unless user
      return { clinic: nil, errors: ["Only clinic admins can update clinic settings"] } unless user.clinic_admin?

      clinic = Clinic.find_by(id: clinic_id)
      return { clinic: nil, errors: ["Clinic not found"] } unless clinic
      return { clinic: nil, errors: ["You are not authorized to manage this clinic"] } unless user.clinic_staff&.clinic_id == clinic.id

      if cancellation_window_hours
        clinic.cancellation_window_hours = cancellation_window_hours
      end

      if clinic.save
        { clinic: clinic, errors: [] }
      else
        { clinic: nil, errors: clinic.errors.full_messages }
      end
    end
  end
end
