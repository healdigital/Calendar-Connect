"use client";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import { Button, Form, Label, Switch, showToast, TextField } from "@calcom/ui";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { OrientationIntentForm } from "./OrientationIntentForm";

interface StudentOnboardingProps {
  onComplete?: () => void;
}

export function StudentOnboarding({ onComplete }: StudentOnboardingProps) {
  const { t } = useLocale();
  const [step, setStep] = useState<"account" | "intent" | "success">("account");
  const utils = trpc.useUtils();

  const { data: me } = trpc.viewer.me.get.useQuery();

  const updateProfileMutation = trpc.viewer.me.updateProfile.useMutation({
    onSuccess: () => {
      setStep("intent");
    },
    onError: (err) => {
      showToast(err.message, "error");
    },
  });

  const upsertIntentMutation = trpc.thotis.intent.upsert.useMutation({
    onSuccess: () => {
      setStep("success");
    },
    onError: (err) => {
      showToast(err.message, "error");
    },
  });

  const accountForm = useForm({
    defaultValues: {
      name: me?.name || "",
    },
  });

  const [marketingConsent, setMarketingConsent] = useState(false);

  const handleAccountSubmit = (data: { name: string }) => {
    updateProfileMutation.mutate({
      name: data.name,
    });
  };

  const handleIntentSubmit = (data: any) => {
    upsertIntentMutation.mutate(data);
  };

  if (step === "success") {
    return (
      <div className="text-center py-10 animate-fade-in">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mx-auto">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("thotis_onboarding_welcome")}</h2>
        <p className="text-gray-600 mb-6">{t("thotis_onboarding_success")}</p>
        <Button onClick={() => onComplete?.()} color="primary">
          {t("thotis_go_to_dashboard")}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
            {step === "account" ? "Step 1: Account setup" : "Step 2: Orientation preferences"}
          </span>
          <span className="text-xs font-semibold inline-block text-blue-600">
            {step === "account" ? "50%" : "100%"}
          </span>
        </div>
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
          <div
            style={{ width: step === "account" ? "50%" : "100%" }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 transition-all duration-500"></div>
        </div>
      </div>

      {step === "account" ? (
        <div className="bg-white border rounded-lg p-6 shadow-sm animate-fade-in">
          <h2 className="text-xl font-bold mb-6">{t("thotis_complete_account")}</h2>
          <Form form={accountForm} handleSubmit={handleAccountSubmit} className="space-y-6">
            <div>
              <Label>{t("name")}</Label>
              <TextField {...accountForm.register("name", { required: true })} placeholder="Your full name" />
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{t("thotis_marketing_consent")}</p>
                  <p className="text-xs text-gray-500">{t("thotis_marketing_consent_desc")}</p>
                </div>
                <Switch checked={marketingConsent} onCheckedChange={setMarketingConsent} />
              </div>
            </div>

            <div className="pt-4 text-xs text-gray-400">{t("thotis_gdpr_note")}</div>

            <Button type="submit" loading={updateProfileMutation.isPending} className="w-full">
              {t("continue")}
            </Button>
          </Form>
        </div>
      ) : (
        <div className="animate-fade-in">
          <OrientationIntentForm onSubmit={handleIntentSubmit} isPending={upsertIntentMutation.isPending} />
        </div>
      )}
    </div>
  );
}
