module Types
  class ScheduleAvailabilityType < Types::BaseObject
    field :id, ID, null: false
    field :day_of_week, Integer, null: false
    field :day_name, String, null: false
    field :start_time, String, null: false
    field :end_time, String, null: false

    def day_name
      ScheduleAvailability::DAY_NAMES[object.day_of_week]
    end

    def start_time
      object.start_time.strftime("%H:%M")
    end

    def end_time
      object.end_time.strftime("%H:%M")
    end
  end
end
