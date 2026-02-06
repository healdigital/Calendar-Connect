import type { Dayjs } from "@calcom/dayjs";
import dayjs from "@calcom/dayjs";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { ThotisAnalyticsEventType } from "@calcom/prisma/enums";
import { trpc } from "@calcom/trpc/react";
import { Button } from "@calcom/ui/components/button";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

/**
 * Thotis Branding Constants
 */
const BRANDING = {
  colors: {
    primary: "#004E89", // Thotis Blue
    secondary: "#FF6B35", // Thotis Orange
  },
  fonts: {
    primary: "Montserrat, sans-serif",
    secondary: "Inter, sans-serif",
  },
};

type WidgetStep = "loading" | "date" | "time" | "form" | "confirming" | "success" | "error";

interface BookingWidgetProps {
  studentProfileId?: string;
  initialStep?: WidgetStep;
}

export const BookingWidget = ({ studentProfileId, initialStep = "date" }: BookingWidgetProps) => {
  const { t } = useLocale();
  const [step, setStep] = useState<WidgetStep>(initialStep);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [errorString, setErrorString] = useState<string | null>(null);
  const [bookingDetails, setBookingDetails] = useState<{
    bookingId?: number;
    googleMeetLink?: string;
  }>({});

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      notes: "",
    },
  });

  // Compute date range for the selected date
  const dateRange = useMemo(() => {
    if (!selectedDate) return null;
    const start = selectedDate.startOf("day").toDate();
    const end = selectedDate.endOf("day").toDate();
    return { start, end };
  }, [selectedDate]);

  // Fetch real availability from backend
  const { data: availabilityData, isLoading: isLoadingSlots } = trpc.thotis.booking.getAvailability.useQuery(
    {
      studentProfileId: studentProfileId || "",
      start: dateRange?.start || new Date(),
      end: dateRange?.end || new Date(),
    },
    {
      enabled: !!studentProfileId && !!dateRange,
    }
  );

  // Filter to only available slots
  const availableSlots = useMemo(() => {
    if (!availabilityData) return [];
    return availabilityData.filter((slot) => slot.available);
  }, [availabilityData]);

  // PostMessage Handling
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        window.parent.postMessage({ type: "THOTIS_RESIZE", height: entry.contentRect.height }, "*");
      }
    });

    const container = document.getElementById("thotis-widget-container");
    if (container) {
      resizeObserver.observe(container);
    }

    return () => resizeObserver.disconnect();
  }, [step]);

  // URL Param Pre-filling
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const name = params.get("name");
      const email = params.get("email");

      if (name) setValue("name", name);
      if (email) setValue("email", email);
    }
  }, [setValue]);

  // Mutation
  const createBookingMutation = trpc.thotis.booking.createSession.useMutation({
    onSuccess: (data) => {
      setBookingDetails({
        bookingId: data.bookingId,
        googleMeetLink: data.googleMeetLink,
      });
      setStep("success");
      window.parent.postMessage(
        {
          type: "THOTIS_BOOKING_SUCCESS",
          bookingId: data.bookingId,
          googleMeetLink: data.googleMeetLink,
        },
        "*"
      );
    },
    onError: (error) => {
      setErrorString(error.message);
      setStep("error");
    },
  });

  const trackEvent = trpc.thotis.analytics.track.useMutation();

  const onSubmit = (data: { name: string; email: string; notes: string }) => {
    if (!selectedSlot || !studentProfileId) return;

    setStep("confirming");
    createBookingMutation.mutate({
      studentProfileId,
      dateTime: new Date(selectedSlot),
      prospectiveStudent: {
        name: data.name,
        email: data.email,
        question: data.notes,
      },
    });
  };

  const handleDateChange = (date: Dayjs) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setStep("time");
  };

  const handleSlotSelect = (slotIso: string) => {
    setSelectedSlot(slotIso);
    setStep("form");

    // Track Postgres Analytics
    if (studentProfileId) {
      trackEvent.mutate({
        eventType: ThotisAnalyticsEventType.booking_started,
        profileId: studentProfileId,
        metadata: {
          slotTime: slotIso,
        },
      });
    }
  };

  // Generate next 14 days for date selection
  const selectableDates = useMemo(() => {
    const dates: Dayjs[] = [];
    for (let i = 1; i <= 14; i++) {
      const d = dayjs().add(i, "day");
      // Skip weekends
      if (d.day() !== 0 && d.day() !== 6) {
        dates.push(d);
      }
    }
    return dates;
  }, []);

  return (
    <div
      id="thotis-widget-container"
      className="flex min-h-[400px] min-w-[320px] flex-col rounded-lg bg-white p-4 shadow-sm font-sans"
      style={{ fontFamily: BRANDING.fonts.secondary }}>
      {/* Header with Logo */}
      <div className="mb-6 flex items-center justify-center">
        <h1
          className="text-2xl font-bold"
          style={{ color: BRANDING.colors.primary, fontFamily: BRANDING.fonts.primary }}>
          THOTIS <span className="ml-2 text-sm font-normal text-gray-500">{t("thotis_mentoring")}</span>
        </h1>
      </div>

      {step === "date" && (
        <div className="animate-fade-in">
          <h2 className="mb-4 text-center text-lg font-semibold">{t("thotis_select_date")}</h2>
          <div className="grid grid-cols-3 gap-2">
            {selectableDates.map((date) => (
              <button
                key={date.format("YYYY-MM-DD")}
                type="button"
                onClick={() => handleDateChange(date)}
                className="rounded-lg border border-gray-200 px-3 py-3 text-center transition-colors hover:border-blue-500 hover:bg-blue-50"
                style={{
                  borderColor:
                    selectedDate?.format("YYYY-MM-DD") === date.format("YYYY-MM-DD")
                      ? BRANDING.colors.primary
                      : undefined,
                }}>
                <div className="text-xs font-medium text-gray-500">{date.format("ddd")}</div>
                <div className="text-lg font-bold text-gray-900">{date.format("D")}</div>
                <div className="text-xs text-gray-500">{date.format("MMM")}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "time" && (
        <div className="animate-fade-in">
          <div className="mb-4 flex items-center">
            <button
              type="button"
              onClick={() => setStep("date")}
              className="mr-2 text-sm text-gray-500 hover:text-gray-700">
              &larr; {t("thotis_back")}
            </button>
            <h2 className="flex-1 text-center text-lg font-semibold">{t("thotis_select_time")}</h2>
          </div>

          {selectedDate && (
            <p className="mb-3 text-center text-sm text-gray-500">
              {selectedDate.format("dddd, MMMM D, YYYY")}
            </p>
          )}

          {isLoadingSlots ? (
            <div className="flex items-center justify-center py-10">
              <div
                className="h-8 w-8 animate-spin rounded-full border-b-2"
                style={{ borderColor: BRANDING.colors.primary }}
              />
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-gray-500">{t("thotis_no_slots_available")}</p>
            </div>
          ) : (
            <div className="grid max-h-[300px] grid-cols-3 gap-2 overflow-y-auto">
              {availableSlots.map((slot) => {
                const slotTime = dayjs(slot.start);
                return (
                  <Button
                    key={slotTime.toISOString()}
                    onClick={() => handleSlotSelect(slotTime.toISOString())}
                    className="w-full justify-center"
                    style={{ borderColor: BRANDING.colors.primary, color: BRANDING.colors.primary }}
                    color="secondary"
                    data-testid="available-slot">
                    {slotTime.format("HH:mm")}
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {step === "form" && (
        <form onSubmit={handleSubmit(onSubmit)} className="animate-fade-in space-y-4">
          <div className="mb-4 flex items-center">
            <button
              type="button"
              onClick={() => setStep("time")}
              className="mr-2 text-sm text-gray-500 hover:text-gray-700">
              &larr; {t("thotis_back")}
            </button>
            <h2 className="flex-1 text-center text-lg font-semibold">{t("thotis_your_details")}</h2>
          </div>

          {selectedDate && selectedSlot && (
            <div className="mb-4 rounded-lg bg-blue-50 px-3 py-2 text-center text-sm text-blue-800">
              {selectedDate.format("ddd, MMM D")} &middot; {dayjs(selectedSlot).format("HH:mm")} -{" "}
              {dayjs(selectedSlot).add(15, "minute").format("HH:mm")}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              {t("your_name")}
            </label>
            <input
              id="name"
              {...register("name", { required: true })}
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            {errors.name && <span className="text-xs text-red-500">{t("thotis_this_field_required")}</span>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              {t("email")}
            </label>
            <input
              id="email"
              type="email"
              {...register("email", { required: true })}
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            {errors.email && <span className="text-xs text-red-500">{t("thotis_this_field_required")}</span>}
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              {t("thotis_notes_optional")}
            </label>
            <textarea
              id="notes"
              {...register("notes")}
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              rows={3}
            />
          </div>

          <Button
            type="submit"
            className="w-full justify-center text-white"
            style={{ backgroundColor: BRANDING.colors.secondary }}
            data-testid="confirm-booking">
            {t("thotis_confirm_booking")}
          </Button>
        </form>
      )}

      {step === "confirming" && (
        <div className="flex flex-col items-center justify-center py-10">
          <div
            className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary"
            style={{ borderColor: BRANDING.colors.primary }}
          />
          <p className="mt-4 text-gray-600">{t("thotis_booking_your_session")}</p>
        </div>
      )}

      {step === "success" && (
        <div className="animate-fade-in flex flex-col items-center justify-center py-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-bold">{t("thotis_booking_confirmed_title")}</h2>
          <p className="mb-6 text-gray-600">{t("thotis_check_email")}</p>

          {bookingDetails.googleMeetLink && (
            <a
              href={bookingDetails.googleMeetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              style={{ backgroundColor: BRANDING.colors.primary }}>
              {t("thotis_join_google_meet")}
            </a>
          )}
        </div>
      )}

      {step === "error" && (
        <div className="animate-fade-in flex flex-col items-center justify-center py-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-bold">{t("thotis_something_wrong")}</h2>
          <p className="mb-6 text-gray-600">{errorString || t("booking_fail")}</p>
          <Button onClick={() => setStep("date")} color="secondary">
            {t("thotis_try_again")}
          </Button>
        </div>
      )}
    </div>
  );
};
