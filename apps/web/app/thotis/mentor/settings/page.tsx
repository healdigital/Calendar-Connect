"use client";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import { Button, Card, TextAreaField, TextField } from "@calcom/ui";
import { Icon } from "@calcom/ui/components/icon";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

export default function MentorSettingsPage() {
  const { t } = useLocale();
  const router = useRouter();
  const { register, handleSubmit, reset } = useForm();

  const { data: profile, isLoading } = trpc.thotis.profile.get.useQuery();

  const updateProfile = trpc.thotis.profile.update.useMutation({
    onSuccess: () => {
      router.refresh();
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        university: profile.university,
        degree: profile.degree,
        bio: profile.bio,
      });
    }
  }, [profile, reset]);

  const onSubmit = (data: any) => {
    updateProfile.mutate({
      university: data.university,
      degree: data.degree,
      bio: data.bio,
    });
  };

  if (isLoading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="container mx-auto max-w-2xl py-10 px-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push("/thotis/dashboard")}
            className="mb-2 flex items-center text-sm text-subtle hover:text-emphasis">
            <Icon name="arrow-left" className="mr-1 h-4 w-4" />
            {t("back_to_dashboard")}
          </button>
          <h1 className="text-2xl font-bold text-emphasis">{t("thotis_profile_settings")}</h1>
        </div>
      </div>

      <div className="bg-default border-subtle rounded-lg border p-6">
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <TextField label={t("thotis_university")} {...register("university")} />
          <TextField label={t("thotis_degree")} {...register("degree")} />
          <TextAreaField label={t("thotis_bio")} {...register("bio")} />

          <Button type="submit" color="primary" loading={updateProfile.isPending}>
            {t("save")}
          </Button>
        </form>
      </div>
    </div>
  );
}
