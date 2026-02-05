"use client";

import { trpc } from "@calcom/trpc/react";
import { Button } from "@calcom/ui";
import { showToast } from "@calcom/ui/v2/core/apps/toast";
import { TextArea } from "@calcom/ui/v2/core/form/fields/TextArea";
import { useMutation } from "@tanstack/react-query"; // Or trpc.useMutation
import { useState } from "react";

export const FeedbackForm = ({ bookingId, email }: { bookingId: number; email: string }) => {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const mutation = trpc.thotis.rating.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      showToast("Merci pour votre retour !", "success");
    },
    onError: (err) => {
      showToast(err.message, "error");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      showToast("Veuillez sélectionner une note", "warning");
      return;
    }
    mutation.mutate({
      bookingId,
      rating,
      feedback: comment,
      email,
    });
  };

  if (submitted) {
    return (
      <div className="text-center">
        <div className="mb-4 text-4xl">🎉</div>
        <h3 className="text-lg font-medium">Merci !</h3>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-center space-x-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`text-4xl transition-colors ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
            onClick={() => setRating(star)}
            onMouseEnter={() => setRating(star)} // Interactive hover
          >
            ★
          </button>
        ))}
      </div>

      <TextArea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Un commentaire ? (Optionnel)"
        rows={4}
      />

      <Button
        type="submit"
        className="w-full justify-center"
        loading={mutation.isLoading}
        disabled={rating === 0}>
        Envoyer
      </Button>
    </form>
  );
};
