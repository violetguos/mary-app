class FormTemplate < ApplicationRecord
  belongs_to :clinic
  has_many :form_submissions, dependent: :restrict_with_error

  validates :name, presence: true
  validates :fields, presence: true
end
