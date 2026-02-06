"use client";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import { Button, Card, TextAreaField, TextField } from "@calcom/ui";
import { Icon } from "@calcom/ui/components/icon";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

export default function MentorSignupPage() {
  const { t } = useLocale();
  const router = useRouter();
  const { register, handleSubmit } = useForm();

  const createProfile = trpc.thotis.profile.create.useMutation({
    onSuccess: () => {
      router.push("/thotis/dashboard");
    },
  });

  const onSubmit = (data: any) => {
    createProfile.mutate({
      university: data.university,
      degree: data.degree,
      fieldOfStudy: data.field,
      yearOfStudy: parseInt(data.year),
      bio: data.bio,
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">{t("thotis_become_mentor")}</h2>
          <p className="mt-2 text-sm text-gray-600">{t("thotis_mentor_signup_desc")}</p>
        </div>

        <div className="bg-default border-subtle mt-8 rounded-lg border p-6">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <TextField label={t("thotis_university")} {...register("university", { required: true })} />
            <TextField label={t("thotis_degree")} {...register("degree", { required: true })} />
            <TextField label={t("thotis_field_of_study")} {...register("field", { required: true })} />
            <TextField
              label={t("thotis_year_of_study")}
              type="number"
              {...register("year", { required: true })}
            />
            <TextAreaField label={t("thotis_bio")} {...register("bio", { required: true })} />

            <Button type="submit" color="primary" className="w-full" loading={createProfile.isPending}>
              {t("thotis_submit_application")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
