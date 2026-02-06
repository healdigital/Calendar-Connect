import dayjs from "@calcom/dayjs";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import type { BookingStatus } from "@calcom/prisma/enums";
import { MentorIncidentType } from "@calcom/prisma/enums";
import { trpc } from "@calcom/trpc/react";
import { DatePicker } from "@calcom/ui";
import { Button } from "@calcom/ui/components/button";
import { Icon } from "@calcom/ui/components/icon";
import { useCallback, useState } from "react";
import { PostSessionForm } from "./PostSessionForm";
import { RatingForm } from "./RatingForm";
import { SessionSummaryView } from "./SessionSummaryView";

interface SessionBooking {
  id: number;
  uid: string;
  title: string;
  startTime: Date | string;
  endTime: Date | string;
  status: BookingStatus | string;
  metadata: any;
  responses: any;
  cancellationReason?: string | null;
  thotisSessionSummary?: { id: number } | null;
}

interface SessionManagementUIProps {
  booking: SessionBooking;
  onActionComplete?: () => void;
  /** Whether the viewer is the mentor (true) or prospective student (false) */
  isMentor?: boolean;
  token?: string;
}

type ModalState = "none" | "cancel" | "reschedule" | "complete" | "incident";

export const SessionManagementUI = ({
  booking,
  onActionComplete,
  isMentor = true,
  token,
}: SessionManagementUIProps) => {
  const { t } = useLocale();
  const [modalState, setModalState] = useState<ModalState>("none");
  const [showPostSessionForm, setShowPostSessionForm] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [newDateTime, setNewDateTime] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [incidentType, setIncidentType] = useState<MentorIncidentType>(MentorIncidentType.OTHER);
  const [incidentDescription, setIncidentDescription] = useState("");
  const utils = trpc.useUtils();

  const { data: availability, isPending: isAvailabilityLoading } =
    trpc.thotis.booking.getAvailability.useQuery(
      {
        // @ts-expect-error
        studentProfileId: booking.metadata?.studentProfileId,
        start: selectedDate ? dayjs(selectedDate).startOf("day").toDate() : new Date(),
        end: selectedDate ? dayjs(selectedDate).endOf("day").toDate() : new Date(),
      },
      {
        // @ts-expect-error
        enabled: !!selectedDate && !!booking.metadata?.studentProfileId && modalState === "reschedule",
      }
    );

  const startTime = dayjs(booking.startTime);
  const endTime = dayjs(booking.endTime);
  const isPast = endTime.isBefore(dayjs());
  const isCancelled = booking.status === "CANCELLED";
  const metadata = booking.metadata as {
    googleMeetLink?: string;
    completedAt?: string;
    studentProfileId?: string;
  } | null;
  const responses = booking.responses as { name?: string; email?: string } | null;

  const cancelMutation = trpc.thotis.booking.cancelSession.useMutation({
    onSuccess: () => {
      setSuccessMessage(t("thotis_session_cancelled"));
      setModalState("none");
      setCancelReason("");
      utils.thotis.booking.mentorSessions.invalidate();
      utils.thotis.guest.getSessionsByToken.invalidate();
      onActionComplete?.();
    },
    onError: (err: { message: string }) => {
      setErrorMessage(err.message);
    },
  });

  const guestCancelMutation = trpc.thotis.guest.cancelByToken.useMutation({
    onSuccess: () => {
      setSuccessMessage(t("thotis_session_cancelled"));
      setModalState("none");
      setCancelReason("");
      utils.thotis.guest.getSessionsByToken.invalidate();
      onActionComplete?.();
    },
    onError: (err: { message: string }) => {
      setErrorMessage(err.message);
    },
  });

  const rescheduleMutation = trpc.thotis.booking.rescheduleSession.useMutation({
    onSuccess: () => {
      setSuccessMessage(t("thotis_session_rescheduled"));
      setModalState("none");
      setNewDateTime("");
      utils.thotis.booking.mentorSessions.invalidate();
      utils.thotis.guest.getSessionsByToken.invalidate();
      onActionComplete?.();
    },
    onError: (err: { message: string }) => {
      setErrorMessage(err.message);
    },
  });

  const guestRescheduleMutation = trpc.thotis.guest.rescheduleByToken.useMutation({
    onSuccess: () => {
      setSuccessMessage(t("thotis_session_rescheduled"));
      setModalState("none");
      setNewDateTime("");
      utils.thotis.guest.getSessionsByToken.invalidate();
      onActionComplete?.();
    },
    onError: (err: { message: string }) => {
      setErrorMessage(err.message);
    },
  });

  const reportIncidentMutation = trpc.thotis.incident.report.useMutation({
    onSuccess: () => {
      setSuccessMessage(t("thotis_incident_reported_success"));
      setModalState("none");
      setIncidentDescription("");
      onActionComplete?.();
    },
    onError: (err: { message: string }) => {
      setErrorMessage(err.message);
    },
  });

  const guestReportMutation = trpc.thotis.guest.reportByToken.useMutation({
    onSuccess: () => {
      setSuccessMessage(t("thotis_incident_reported_success"));
      setModalState("none");
      setIncidentDescription("");
      utils.thotis.guest.getSessionsByToken.invalidate();
      onActionComplete?.();
    },
    onError: (err: { message: string }) => {
      setErrorMessage(err.message);
    },
  });

  const completeMutation = trpc.thotis.booking.markComplete.useMutation({
    onSuccess: () => {
      setSuccessMessage(t("thotis_session_completed"));
      setModalState("none");
      utils.thotis.booking.mentorSessions.invalidate();
      onActionComplete?.();
    },
    onError: (err: { message: string }) => {
      setErrorMessage(err.message);
    },
  });

  const handleCancel = useCallback(() => {
    if (!cancelReason.trim()) return;
    if (token) {
      guestCancelMutation.mutate({
        token,
        bookingId: booking.id,
        reason: cancelReason,
      });
    } else {
      cancelMutation.mutate({
        bookingId: booking.id,
        reason: cancelReason,
        cancelledBy: isMentor ? "mentor" : "student",
      });
    }
  }, [booking.id, cancelReason, cancelMutation, guestCancelMutation, isMentor, token]);

  const handleReschedule = useCallback(
    (dateTime?: Date) => {
      // Strictly prefer the selected slot from the UI grid if no specific date passed
      const targetDate = dateTime || (selectedSlot ? new Date(selectedSlot) : null);

      if (!targetDate) {
        setErrorMessage(t("thotis_select_slot_error")); // "Please select a time slot"
        return;
      }

      if (token) {
        guestRescheduleMutation.mutate({
          token,
          bookingId: booking.id,
          newDateTime: targetDate,
        });
      } else {
        rescheduleMutation.mutate({
          bookingId: booking.id,
          newDateTime: targetDate,
        });
      }
    },
    [booking.id, selectedSlot, rescheduleMutation, guestRescheduleMutation, token, t]
  );

  const handleComplete = useCallback(() => {
    completeMutation.mutate({ bookingId: booking.id });
  }, [booking.id, completeMutation]);

  const handleReportIncident = useCallback(() => {
    if (token) {
      guestReportMutation.mutate({
        token,
        bookingId: booking.id,
        type: incidentType,
        description: incidentDescription,
      });
    } else {
      reportIncidentMutation.mutate({
        bookingId: booking.id,
        type: incidentType,
        description: incidentDescription,
      });
    }
  }, [booking.id, incidentType, incidentDescription, reportIncidentMutation, guestReportMutation, token]);

  const getStatusBadge = () => {
    if (isCancelled) {
      return (
        <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
          {t("thotis_session_cancelled_status")}
        </span>
      );
    }
    if (metadata?.completedAt) {
      return (
        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
          {t("thotis_session_completed_status")}
        </span>
      );
    }
    if (isPast) {
      return (
        <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700">
          {t("thotis_session_pending")}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
        {t("thotis_session_accepted")}
      </span>
    );
  };

  // Grace period logic: allow joining up to 15 minutes after end time
  const now = dayjs();
  const gracePeriodEnd = endTime.add(15, "minute");
  // isPast is strictly for "booking is technically over", but for buttons we check grace period
  const isPastStrict = endTime.isBefore(now);
  const isInGracePeriod = isPastStrict && now.isBefore(gracePeriodEnd);

  const canJoin = !isCancelled && (!isPastStrict || isInGracePeriod);

  // Mentors can create the room if it's today (or within window)

  const canCancel = !isCancelled && !metadata?.completedAt && !isPastStrict;
  const canReschedule = !isCancelled && !metadata?.completedAt && !isPastStrict;
  const canComplete = !isCancelled && !metadata?.completedAt && (isPastStrict || isInGracePeriod); // Can complete during grace period too

  return (
    <div className="bg-default border-subtle rounded-lg border p-4">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
          {successMessage}
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="ml-2 text-green-600 hover:text-green-800">
            &times;
          </button>
        </div>
      )}
      {errorMessage && (
        <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          {errorMessage}
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="ml-2 text-red-600 hover:text-red-800">
            &times;
          </button>
        </div>
      )}

      {/* Session Info */}
      <div className="mb-3 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-emphasis text-sm font-semibold">
              {responses?.name ? t("thotis_session_with", { name: responses.name }) : booking.title}
            </h3>
            {getStatusBadge()}
          </div>
          <div className="text-subtle mt-1 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
              <Icon name="info" className="h-4 w-4 text-blue-600" />
            </div>
            <span className="flex items-center gap-1">
              <Icon name="calendar" className="h-3 w-3" />
              {startTime.format("ddd, MMM D, YYYY")}
            </span>
            <span className="flex items-center gap-1">
              <Icon name="clock" className="h-3 w-3" />
              {startTime.format("HH:mm")} - {endTime.format("HH:mm")}
            </span>
            {responses?.email && (
              <span className="flex items-center gap-1">
                <Icon name="mail" className="h-3 w-3" />
                {responses.email}
              </span>
            )}
          </div>
        </div>

        {metadata?.googleMeetLink && canJoin && (
          <a href={metadata.googleMeetLink} target="_blank" rel="noopener noreferrer" className="shrink-0">
            <Button color={isMentor ? "primary" : "secondary"} size="sm" StartIcon="video">
              {isMentor ? t("thotis_start_session") : t("thotis_join_session")}
            </Button>
          </a>
        )}
      </div>

      {isMentor && (
        <PostSessionForm
          bookingId={booking.id}
          open={showPostSessionForm}
          onOpenChange={setShowPostSessionForm}
        />
      )}

      {!isMentor && (
        <SessionSummaryView
          bookingId={booking.id}
          token={token}
          open={showSummary}
          onOpenChange={setShowSummary}
        />
      )}

      {/* Action Buttons */}
      {(canCancel ||
        canReschedule ||
        canComplete ||
        (isMentor && metadata?.completedAt) ||
        (!isMentor && booking.thotisSessionSummary)) && (
        <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3">
          {isMentor && metadata?.completedAt && (
            <Button
              color="primary"
              size="sm"
              StartIcon="file-text"
              onClick={() => setShowPostSessionForm(true)}>
              {booking.thotisSessionSummary ? t("thotis_edit_summary") : t("thotis_add_summary")}
            </Button>
          )}
          {!isMentor && booking.thotisSessionSummary && (
            <Button color="primary" size="sm" StartIcon="file-text" onClick={() => setShowSummary(true)}>
              {t("thotis_view_summary")}
            </Button>
          )}
          {canCancel && (
            <Button
              color="destructive"
              size="sm"
              StartIcon="x"
              onClick={() => setModalState("cancel")}
              disabled={cancelMutation.isPending || guestCancelMutation.isPending}
              data-testid="cancel-button">
              {t("thotis_cancel_session")}
            </Button>
          )}
          {canReschedule && (
            <Button
              color="secondary"
              size="sm"
              StartIcon="calendar"
              onClick={() => setModalState("reschedule")}
              disabled={rescheduleMutation.isPending || guestRescheduleMutation.isPending}
              data-testid="reschedule-button">
              {t("thotis_reschedule_session")}
            </Button>
          )}
          {canComplete && isMentor && (
            <Button
              color="primary"
              size="sm"
              StartIcon="check"
              onClick={() => setModalState("complete")}
              disabled={completeMutation.isPending}>
              {t("thotis_mark_complete")}
            </Button>
          )}
          {!isCancelled && !metadata?.completedAt && !isMentor && (
            <Button
              color="secondary"
              size="sm"
              StartIcon="info"
              onClick={() => setModalState("incident")}
              disabled={reportIncidentMutation.isPending || guestReportMutation.isPending}>
              {t("thotis_report_issue")}
            </Button>
          )}
        </div>
      )}

      {/* Cancel Modal */}
      {modalState === "cancel" && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3">
          <h4 className="mb-2 text-sm font-medium text-red-800">{t("thotis_cancel_session")}</h4>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder={t("thotis_cancel_reason_placeholder")}
            className="mb-2 w-full rounded-md border border-red-200 bg-white p-2 text-sm"
            rows={2}
          />
          <div className="flex gap-2">
            <Button
              color="destructive"
              size="sm"
              onClick={handleCancel}
              disabled={!cancelReason.trim() || cancelMutation.isPending || guestCancelMutation.isPending}
              loading={cancelMutation.isPending || guestCancelMutation.isPending}
              data-testid="confirm-cancel">
              {t("thotis_confirm_cancel")}
            </Button>
            <Button color="minimal" size="sm" onClick={() => setModalState("none")}>
              {t("thotis_back")}
            </Button>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {modalState === "reschedule" && (
        <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3">
          <h4 className="mb-2 text-sm font-medium text-blue-800">{t("thotis_reschedule_session")}</h4>
          <p className="mb-3 text-xs text-blue-700">{t("thotis_reschedule_description")}</p>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-blue-700">
                {t("thotis_select_date")}
              </label>
              <DatePicker
                date={selectedDate}
                onDateChange={setSelectedDate}
                minDate={new Date()}
                className="w-full rounded-md border border-blue-200 bg-white p-2 text-sm"
              />
            </div>

            {selectedDate && (
              <div className="mt-2">
                <label className="mb-1 block text-xs font-medium text-blue-700">
                  {t("thotis_available_slots")}
                </label>
                {isAvailabilityLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-t-2 border-blue-600" />
                  </div>
                ) : !availability || availability.length === 0 ? (
                  <p className="text-xs text-blue-600 italic">No slots available for this date.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {availability.map((slot: any) => {
                      const slotDate = new Date(slot.time);
                      const isSelected = selectedSlot === slot.time;
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          onClick={() => setSelectedSlot(slot.time)}
                          className={`rounded-md border px-2 py-1 text-xs transition-colors ${
                            isSelected
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-blue-200 bg-white text-blue-700 hover:border-blue-400"
                          }`}>
                          {dayjs(slotDate).format("HH:mm")}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <Button
              color="primary"
              size="sm"
              className="w-full justify-center"
              onClick={() => handleReschedule()}
              disabled={!selectedSlot || rescheduleMutation.isPending || guestRescheduleMutation.isPending}
              loading={rescheduleMutation.isPending || guestRescheduleMutation.isPending}>
              {t("thotis_confirm_reschedule")}
            </Button>
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              color="minimal"
              size="sm"
              onClick={() => {
                setModalState("none");
                setSelectedDate(null);
                setSelectedSlot(null);
              }}>
              {t("thotis_back")}
            </Button>
          </div>
        </div>
      )}

      {/* Incident Modal */}
      {modalState === "incident" && (
        <div className="mt-3 rounded-md border border-yellow-200 bg-yellow-50 p-3">
          <h4 className="mb-2 text-sm font-medium text-yellow-800">{t("thotis_report_issue")}</h4>
          <div className="mb-2">
            <label className="mb-1 block text-xs text-yellow-700">{t("thotis_incident_type")}</label>
            <select
              value={incidentType}
              onChange={(e) => setIncidentType(e.target.value as MentorIncidentType)}
              className="w-full rounded-md border border-yellow-200 bg-white p-2 text-sm">
              {Object.values(MentorIncidentType).map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-2">
            <label className="mb-1 block text-xs text-yellow-700">{t("thotis_incident_description")}</label>
            <textarea
              value={incidentDescription}
              onChange={(e) => setIncidentDescription(e.target.value)}
              placeholder={t("thotis_incident_description_placeholder")}
              className="w-full rounded-md border border-yellow-200 bg-white p-2 text-sm"
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <Button
              color="primary"
              size="sm"
              onClick={handleReportIncident}
              disabled={reportIncidentMutation.isPending || guestReportMutation.isPending}
              loading={reportIncidentMutation.isPending || guestReportMutation.isPending}>
              {t("thotis_confirm_report")}
            </Button>
            <Button color="minimal" size="sm" onClick={() => setModalState("none")}>
              {t("thotis_back")}
            </Button>
          </div>
        </div>
      )}

      {/* Complete Confirmation */}
      {modalState === "complete" && (
        <div className="mt-3 rounded-md border border-green-200 bg-green-50 p-3">
          <h4 className="mb-2 text-sm font-medium text-green-800">{t("thotis_mark_complete")}</h4>
          <p className="mb-2 text-xs text-green-700">
            This will mark the session as completed and send a feedback request to the student.
          </p>
          <div className="flex gap-2">
            <Button
              color="primary"
              size="sm"
              onClick={handleComplete}
              disabled={completeMutation.isPending}
              loading={completeMutation.isPending}>
              {t("thotis_confirm_complete")}
            </Button>
            <Button color="minimal" size="sm" onClick={() => setModalState("none")}>
              {t("thotis_back")}
            </Button>
          </div>
        </div>
      )}

      {/* NEW: Student Rating & Feedback Section (Only for students, past sessions, completed/accepted) */}
      {!isMentor && (isPast || metadata?.completedAt) && !isCancelled && responses?.email && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <RatingForm bookingId={booking.id} email={responses.email} token={token} />
        </div>
      )}

      {/* Cancellation reason display for already-cancelled bookings */}
      {isCancelled && booking.cancellationReason && (
        <div className="mt-2 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
          <strong>{t("thotis_cancel_reason")}:</strong> {booking.cancellationReason}
        </div>
      )}
    </div>
  );
};
