"use client";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import { Button } from "@calcom/ui/components/button";
import { TextField } from "@calcom/ui/components/form";
import { showToast } from "@calcom/ui/components/toast";
import { useState } from "react";
import { useForm } from "react-hook-form";

export function GuestMagicLinkForm() {
  const { t } = useLocale();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ email: string }>();

  const mutation = trpc.thotis.guest.requestInboxLink.useMutation({
    onSuccess: () => {
      setIsSubmitted(true);
      showToast(t("thotis_magic_link_sent"), "success");
    },
    onError: (error) => {
      showToast(error.message, "error");
    },
  });

  const onSubmit = (data: { email: string }) => {
    mutation.mutate(data);
  };

  if (isSubmitted) {
    return (
      <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold mb-2">{t("thotis_check_your_email")}</h2>
        <p className="text-gray-600">{t("thotis_magic_link_sent_desc")}</p>
        <Button className="mt-6" color="minimal" onClick={() => setIsSubmitted(false)}>
          {t("thotis_try_another_email")}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8 bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">{t("thotis_guest_access")}</h2>
      <p className="text-sm text-gray-600 mb-6">{t("thotis_guest_access_desc")}</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <TextField
          label={t("email")}
          type="email"
          placeholder="your@email.com"
          {...register("email", { required: true })}
        />
        {errors.email && <p className="text-xs text-red-500">{t("email_required")}</p>}
        <Button type="submit" className="w-full" loading={mutation.isPending}>
          {t("thotis_request_magic_link")}
        </Button>
      </form>
    </div>
  );
}
