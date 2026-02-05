import type {
  CancelBookingMeta,
  CancelRegularBookingData,
  HandleCancelBookingResponse,
} from "../dto/BookingCancel";

export interface IBookingCancelService {
  cancelBooking(input: {
    bookingData: CancelRegularBookingData;
    bookingMeta?: CancelBookingMeta;
  }): Promise<HandleCancelBookingResponse>;
}
