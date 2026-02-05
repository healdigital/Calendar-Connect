import dayjs from "@calcom/dayjs";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import classNames from "@calcom/ui/classNames";
import { Button } from "@calcom/ui/components/button";
import { Icon } from "@calcom/ui/components/icon";
import { useCallback, useState } from "react";
import { RatingForm } from "./RatingForm";

interface SessionBooking {
  id: number;
  uid: string;
  title: string;
  startTime: Date | string;
  endTime: Date | string;
  status: string;
  metadata: Record<string, unknown> | null;
  responses: Record<string, unknown> | null;
  cancellationReason?: string | null;
}

interface SessionManagementUIProps {
  booking: SessionBooking;
  onActionComplete?: () => void;
  /** Whether the viewer is the mentor (true) or prospective student (false) */
  isMentor?: boolean;
}

type ModalState = "none" | "cancel" | "reschedule" | "complete";

export const SessionManagementUI = ({
  booking,
  onActionComplete,
  isMentor = true,
}: SessionManagementUIProps) => {
  const { t } = useLocale();
  const [modalState, setModalState] = useState<ModalState>("none");
  const [cancelReason, setCancelReason] = useState("");
  const [newDateTime, setNewDateTime] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const utils = trpc.useUtils();

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
      onActionComplete?.();
    },
    onError: (err) => {
      setErrorMessage(err.message);
    },
  });

  const rescheduleMutation = trpc.thotis.booking.rescheduleSession.useMutation({
    onSuccess: () => {
      setSuccessMessage(t("thotis_session_rescheduled"));
      setModalState("none");
      setNewDateTime("");
      utils.thotis.booking.mentorSessions.invalidate();
      onActionComplete?.();
    },
    onError: (err) => {
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
    onError: (err) => {
      setErrorMessage(err.message);
    },
  });

  const handleCancel = useCallback(() => {
    if (!cancelReason.trim()) return;
    cancelMutation.mutate({
      bookingId: booking.id,
      reason: cancelReason,
      cancelledBy: isMentor ? "mentor" : "student",
    });
  }, [booking.id, cancelReason, cancelMutation, isMentor]);

  const handleReschedule = useCallback(() => {
    if (!newDateTime) return;
    rescheduleMutation.mutate({
      bookingId: booking.id,
      newDateTime: new Date(newDateTime),
    });
  }, [booking.id, newDateTime, rescheduleMutation, isMentor]);

  const handleComplete = useCallback(() => {
    completeMutation.mutate({ bookingId: booking.id });
  }, [booking.id, completeMutation]);

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

      {/* Action Buttons */}
      {(canCancel || canReschedule || canComplete) && (
        <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3">
          {canCancel && (
            <Button
              color="destructive"
              size="sm"
              StartIcon="x"
              onClick={() => setModalState("cancel")}
              disabled={cancelMutation.isPending}>
              {t("thotis_cancel_session")}
            </Button>
          )}
          {canReschedule && (
            <Button
              color="secondary"
              size="sm"
              StartIcon="calendar"
              onClick={() => setModalState("reschedule")}
              disabled={rescheduleMutation.isPending}>
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
              disabled={!cancelReason.trim() || cancelMutation.isPending}
              loading={cancelMutation.isPending}>
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
          <label className="mb-1 block text-xs text-blue-700">{t("thotis_select_new_time")}</label>
          <input
            type="datetime-local"
            value={newDateTime}
            onChange={(e) => setNewDateTime(e.target.value)}
            min={dayjs().add(3, "hour").format("YYYY-MM-DDTHH:mm")}
            className="mb-2 w-full rounded-md border border-blue-200 bg-white p-2 text-sm"
          />
          <div className="flex gap-2">
            <Button
              color="primary"
              size="sm"
              onClick={handleReschedule}
              disabled={!newDateTime || rescheduleMutation.isPending}
              loading={rescheduleMutation.isPending}>
              {t("thotis_confirm_reschedule")}
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
          <RatingForm bookingId={booking.id} email={responses.email} />
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
