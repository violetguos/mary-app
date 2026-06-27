module Mutations
  class Signup < Mutations::BaseMutation
    argument :email, String, required: true
    argument :password, String, required: true
    argument :first_name, String, required: true
    argument :last_name, String, required: true
    argument :clinic_id, ID, required: true

    field :user, Types::UserType, null: true
    field :token, String, null: true
    field :errors, [String], null: false

    def resolve(email:, password:, first_name:, last_name:, clinic_id:)
      user = User.new(email: email, password: password, role: "patient")

      if user.save
        user.create_patient_profile!(
          first_name: first_name,
          last_name: last_name,
          clinic_id: clinic_id
        )
        { user: user, token: user.auth_token, errors: [] }
      else
        { user: nil, token: nil, errors: user.errors.full_messages }
      end
    end
  end
end
