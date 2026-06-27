class AuditLog < ApplicationRecord
  belongs_to :actor, class_name: "User", optional: true

  validates :action, :resource_type, presence: true
end
