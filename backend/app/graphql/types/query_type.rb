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
  end
end
