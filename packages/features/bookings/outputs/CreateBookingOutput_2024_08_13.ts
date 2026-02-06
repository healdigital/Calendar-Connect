import type { BookingOutput_2024_08_13 } from "./BookingOutput_2024_08_13";
import type { RecurringBookingOutput_2024_08_13 } from "./RecurringBookingOutput_2024_08_13";
import type { CreateSeatedBookingOutput_2024_08_13 } from "./CreateSeatedBookingOutput_2024_08_13";
import type { CreateRecurringSeatedBookingOutput_2024_08_13 } from "./CreateRecurringSeatedBookingOutput_2024_08_13";

export type CreateBookingOutput_2024_08_13 = {
  status: "success" | "error";
  data:
    | BookingOutput_2024_08_13
    | RecurringBookingOutput_2024_08_13[]
    | CreateSeatedBookingOutput_2024_08_13
    | CreateRecurringSeatedBookingOutput_2024_08_13[];
};
