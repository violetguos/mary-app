class ScheduleAvailability < ApplicationRecord
  belongs_to :practitioner_profile

  validates :day_of_week, presence: true, inclusion: { in: 0..6 }
  validates :start_time, :end_time, presence: true
  validate :end_time_after_start_time

  DAY_NAMES = %w[Sunday Monday Tuesday Wednesday Thursday Friday Saturday].freeze

  private

  def end_time_after_start_time
    return unless start_time && end_time
    errors.add(:end_time, "must be after start time") if end_time <= start_time
  end
end
