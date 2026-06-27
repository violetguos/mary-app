class FormSubmission < ApplicationRecord
  belongs_to :patient, class_name: "User"
  belongs_to :clinic
  belongs_to :form_template

  validates :answers, presence: true
end
