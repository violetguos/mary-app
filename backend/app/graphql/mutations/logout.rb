module Mutations
  class Logout < Mutations::BaseMutation
    field :success, Boolean, null: false

    def resolve
      user = context[:current_user]
      if user
        user.update!(auth_token: nil)
        { success: true }
      else
        { success: false }
      end
    end
  end
end
