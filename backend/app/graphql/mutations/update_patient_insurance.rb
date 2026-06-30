module Mutations
  class UpdatePatientInsurance < Mutations::BaseMutation
    argument :insurer, String, required: false
    argument :plan_number, String, required: false
    argument :member_id, String, required: false

    field :patient_profile, Types::PatientProfileType, null: true
    field :errors, [String], null: false

    def resolve(insurer: nil, plan_number: nil, member_id: nil)
      user = context[:current_user]
      return { patient_profile: nil, errors: ["Not authenticated"] } unless user

      profile = user.patient_profile
      return { patient_profile: nil, errors: ["Patient profile not found"] } unless profile

      profile.assign_attributes(
        insurer: insurer.presence || profile.insurer,
        plan_number: plan_number.presence || profile.plan_number,
        member_id: member_id.presence || profile.member_id,
      )

      if profile.save
        { patient_profile: profile, errors: [] }
      else
        { patient_profile: nil, errors: profile.errors.full_messages }
      end
    end
  end
end
