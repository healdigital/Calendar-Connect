import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import { Button } from "@calcom/ui/components/button";
import { Icon } from "@calcom/ui/components/icon";
import { useCallback, useState } from "react";

interface RatingFormProps {
  bookingId: number;
  email: string;
  onRatingSubmitted?: () => void;
  token?: string;
}

export const RatingForm = ({ bookingId, email, onRatingSubmitted, token }: RatingFormProps) => {
  const { t } = useLocale();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if already rated
  const guestRatingQuery = trpc.thotis.guest.getRatingByToken.useQuery(
    { bookingId, token: token! },
    { enabled: !!bookingId && !!token }
  );

  const authRatingQuery = trpc.thotis.rating.getByBooking.useQuery(
    { bookingId },
    { enabled: !!bookingId && !token }
  );

  const existingRating = token ? guestRatingQuery.data : authRatingQuery.data;
  const isExistingRatingPending = token ? guestRatingQuery.isPending : authRatingQuery.isPending;

  const utils = trpc.useUtils();

  const submitMutation = trpc.thotis.rating.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      onRatingSubmitted?.();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const guestSubmitMutation = trpc.thotis.guest.rateByToken.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      utils.thotis.guest.getSessionsByToken.invalidate();
      onRatingSubmitted?.();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = useCallback(() => {
    if (rating === 0) {
      setError(t("thotis_rating_required"));
      return;
    }

    setError(null);
    if (token) {
      guestSubmitMutation.mutate({
        token,
        bookingId,
        rating,
        feedback: feedback.trim() || undefined,
      });
    } else {
      submitMutation.mutate({
        bookingId,
        rating,
        feedback: feedback.trim() || undefined,
        email,
      });
    }
  }, [bookingId, rating, feedback, email, submitMutation, guestSubmitMutation, token, t]);

  // If loading rating status
  if (isExistingRatingPending) {
    return (
      <div className="bg-default border-subtle flex h-24 items-center justify-center rounded-lg border p-4">
        <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-t-2 border-blue-600" />
      </div>
    );
  }

  // If already rated, show the existing rating
  if (existingRating) {
    return (
      <div className="bg-default border-subtle rounded-lg border p-4">
        <h3 className="text-emphasis mb-2 text-sm font-semibold">{t("thotis_rate_session")}</h3>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Icon
              key={star}
              name="star"
              className={`h-5 w-5 ${
                star <= existingRating.rating
                  ? "fill-orange-400 text-orange-400"
                  : "fill-gray-200 text-gray-200"
              }`}
            />
          ))}
          <span className="text-subtle ml-2 text-sm">({existingRating.rating}/5)</span>
        </div>
        {existingRating.feedback && (
          <p className="text-subtle mt-2 text-sm italic">&ldquo;{existingRating.feedback}&rdquo;</p>
        )}
      </div>
    );
  }

  // If submitted successfully
  if (submitted) {
    return (
      <div className="bg-default border-subtle rounded-lg border p-4 text-center">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
          <Icon name="check" className="h-5 w-5 text-green-600" />
        </div>
        <p className="text-emphasis text-sm font-medium">{t("thotis_rating_submitted")}</p>
      </div>
    );
  }

  return (
    <div className="bg-default border-subtle rounded-lg border p-4">
      <h3 className="text-emphasis mb-3 text-sm font-semibold">{t("thotis_rate_session")}</h3>

      {error && <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

      {/* Star Rating */}
      <div className="mb-3">
        <label className="text-subtle mb-1 block text-xs font-medium">{t("thotis_rating_label")}</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => setRating(star)}
              className="transition-transform hover:scale-110"
              title={t("thotis_stars", { count: star })}>
              <Icon
                name="star"
                className={`h-7 w-7 ${
                  star <= (hoveredRating || rating)
                    ? "fill-orange-400 text-orange-400"
                    : "fill-gray-200 text-gray-200"
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="text-subtle ml-2 text-sm">{t("thotis_stars", { count: rating })}</span>
          )}
        </div>
      </div>

      {/* Feedback textarea */}
      <div className="mb-3">
        <label htmlFor={`feedback-${bookingId}`} className="text-subtle mb-1 block text-xs font-medium">
          {t("thotis_feedback_label")}
        </label>
        <textarea
          id={`feedback-${bookingId}`}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder={t("thotis_feedback_placeholder")}
          className="border-subtle bg-default w-full rounded-md border p-2 text-sm"
          rows={3}
        />
      </div>

      <Button
        color="primary"
        size="sm"
        onClick={handleSubmit}
        disabled={rating === 0 || submitMutation.isPending || guestSubmitMutation.isPending}
        loading={submitMutation.isPending || guestSubmitMutation.isPending}
        className="w-full justify-center">
        {t("thotis_submit_rating")}
      </Button>
    </div>
  );
};
