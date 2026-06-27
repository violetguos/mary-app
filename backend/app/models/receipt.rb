class Receipt < ApplicationRecord
  belongs_to :payment

  validates :receipt_number, presence: true, uniqueness: true
end
