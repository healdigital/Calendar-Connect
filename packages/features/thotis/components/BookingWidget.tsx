import type { Dayjs } from "@calcom/dayjs";
import dayjs from "@calcom/dayjs";
import { DatePicker } from "@calcom/features/calendars/components/DatePicker";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import { Button } from "@calcom/ui/components/button";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

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
  studentId?: number; // Optional, can be derived or passed
  initialStep?: WidgetStep;
}

export const BookingWidget = ({ studentId, initialStep = "date" }: BookingWidgetProps) => {
  const { t } = useLocale();
  const [step, setStep] = useState<WidgetStep>(initialStep);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null); // ISO string
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

  // PostMessage Handling
  useEffect(() => {
    // Notify parent about resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        window.parent.postMessage(
          {
            type: "THOTIS_RESIZE",
            height: entry.contentRect.height,
          },
          "*"
        ); // In production, replace '*' with specific origin
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
  const createBookingMutation = trpc.thotis.createStudentSession.useMutation({
    onSuccess: (data) => {
      setBookingDetails({
        bookingId: data.id,
        googleMeetLink: data.googleMeetLink,
      });
      setStep("success");
      window.parent.postMessage(
        {
          type: "THOTIS_BOOKING_SUCCESS",
          bookingId: data.id,
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

  const onSubmit = (data: { name: string; email: string; notes: string }) => {
    if (!selectedSlot || !studentId) return;

    setStep("confirming");
    createBookingMutation.mutate({
      studentId: studentId,
      startTime: selectedSlot,
      studentEmail: data.email,
      studentName: data.name,
      notes: data.notes,
    });
  };

  const handleDateChange = (date: Dayjs | null) => {
    if (date) {
      setSelectedDate(date);
      setStep("time");
    }
  };

  const handleSlotSelect = (slotIso: string) => {
    setSelectedSlot(slotIso);
    setStep("form");
  };

  return (
    <div
      id="thotis-widget-container"
      className="flex flex-col min-w-[320px] min-h-[400px] bg-white rounded-lg shadow-sm p-4 font-sans"
      style={{ fontFamily: BRANDING.fonts.secondary }}>
      {/* Header with Logo */}
      <div className="flex items-center justify-center mb-6">
        <h1
          className="text-2xl font-bold"
          style={{ color: BRANDING.colors.primary, fontFamily: BRANDING.fonts.primary }}>
          THOTIS <span className="text-sm font-normal text-gray-500 ml-2">{t("thotis_mentoring")}</span>
        </h1>
      </div>

      {step === "date" && (
        <div className="animate-fade-in">
          <h2 className="text-lg font-semibold mb-4 text-center">{t("thotis_select_date")}</h2>
          <DatePicker
            onChange={handleDateChange}
            onMonthChange={() => {}} // Handle month change logic
            locale="en" // Should use user locale but DatePicker might expect specific string
            selected={selectedDate}
            weekStart={1}
          />
        </div>
      )}

      {step === "time" && (
        <div className="animate-fade-in">
          <div className="flex items-center mb-4">
            <button
              onClick={() => setStep("date")}
              className="text-sm text-gray-500 hover:text-gray-700 mr-2">
              ← {t("thotis_back")}
            </button>
            <h2 className="text-lg font-semibold text-center flex-1">{t("thotis_select_time")}</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
            {/* Placeholder Slots - Real implementation needs TRPC data */}
            {selectedDate &&
              [9, 10, 11, 14, 15, 16].map((hour) => {
                const time = selectedDate.hour(hour).minute(0).second(0);
                return (
                  <Button
                    key={hour}
                    onClick={() => handleSlotSelect(time.toISOString())}
                    className="w-full justify-center"
                    style={{ borderColor: BRANDING.colors.primary, color: BRANDING.colors.primary }}
                    color="secondary">
                    {time.format("HH:mm")}
                  </Button>
                );
              })}
          </div>
        </div>
      )}

      {step === "form" && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 animate-fade-in">
          <div className="flex items-center mb-4">
            <button
              type="button"
              onClick={() => setStep("time")}
              className="text-sm text-gray-500 hover:text-gray-700 mr-2">
              ← {t("thotis_back")}
            </button>
            <h2 className="text-lg font-semibold text-center flex-1">{t("thotis_your_details")}</h2>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              {t("your_name")}
            </label>
            <input
              id="name"
              {...register("name", { required: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            />
            {errors.name && <span className="text-red-500 text-xs">{t("thotis_this_field_required")}</span>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              {t("email")}
            </label>
            <input
              id="email"
              type="email"
              {...register("email", { required: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            />
            {errors.email && <span className="text-red-500 text-xs">{t("thotis_this_field_required")}</span>}
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              {t("thotis_notes_optional")}
            </label>
            <textarea
              id="notes"
              {...register("notes")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              rows={3}
            />
          </div>

          <Button
            type="submit"
            className="w-full justify-center text-white"
            style={{ backgroundColor: BRANDING.colors.secondary }}>
            {t("thotis_confirm_booking")}
          </Button>
        </form>
      )}

      {step === "confirming" && (
        <div className="flex flex-col items-center justify-center py-10">
          <div
            className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"
            style={{ borderColor: BRANDING.colors.primary }}></div>
          <p className="mt-4 text-gray-600">{t("thotis_booking_your_session")}</p>
        </div>
      )}

      {step === "success" && (
        <div className="flex flex-col items-center justify-center py-6 text-center animate-fade-in">
          <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">{t("thotis_booking_confirmed_title")}</h2>
          <p className="text-gray-600 mb-6">{t("thotis_check_email")}</p>

          {bookingDetails.googleMeetLink && (
            <a
              href={bookingDetails.googleMeetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              style={{ backgroundColor: BRANDING.colors.primary }}>
              {t("thotis_join_google_meet")}
            </a>
          )}
        </div>
      )}

      {step === "error" && (
        <div className="flex flex-col items-center justify-center py-6 text-center animate-fade-in">
          <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">{t("thotis_something_wrong")}</h2>
          <p className="text-gray-600 mb-6">{errorString || t("booking_fail")}</p>
          <Button onClick={() => setStep("date")} color="secondary">
            {t("thotis_try_again")}
          </Button>
        </div>
      )}
    </div>
  );
};
