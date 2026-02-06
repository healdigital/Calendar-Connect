export interface AvailabilityInput {
  days: string[];
  startTime: string;
  endTime: string;
}

export interface CreateScheduleInput_2024_04_15 {
  name: string;
  timeZone: string;
  isDefault?: boolean;
  availability?: AvailabilityInput[];
}
