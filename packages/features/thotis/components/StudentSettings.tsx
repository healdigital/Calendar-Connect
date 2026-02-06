import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import { Button, Form, Label, Switch, showToast, TextField } from "@calcom/ui";
import { useState } from "react";
import { useForm } from "react-hook-form";

interface StudentSettingsProps {
  user: {
    id: number;
    name: string | null;
    email: string;
  };
}

export const StudentSettings = ({ user }: StudentSettingsProps) => {
  const { t } = useLocale();
  const utils = trpc.useUtils();

  const form = useForm({
    defaultValues: {
      name: user.name || "",
    },
  });

  const updateProfileMutation = trpc.viewer.updateProfile.useMutation({
    onSuccess: () => {
      showToast(t("thotis_profile_updated"), "success"); // "Profile updated"
      utils.viewer.me.invalidate();
    },
    onError: (err) => {
      showToast(err.message, "error");
    },
  });

  const [marketingConsent, setMarketingConsent] = useState(false); // detailed consent storage would need DB schema update

  const onSubmit = (data: { name: string }) => {
    updateProfileMutation.mutate({
      name: data.name,
    });
  };

  return (
    <div className="bg-default border-subtle rounded-lg border p-6">
      <h2 className="text-emphasis mb-4 text-lg font-bold">{t("thotis_my_profile")}</h2>

      <Form form={form} handleSubmit={onSubmit} className="space-y-6 max-w-md">
        <div>
          <Label htmlFor="email">{t("email")}</Label>
          <TextField id="email" value={user.email} disabled className="bg-subtle text-muted" />
          <p className="text-subtle text-xs mt-1">{t("thotis_email_cannot_change")}</p>
        </div>

        <div>
          <Label htmlFor="name">{t("name")}</Label>
          <TextField id="name" {...form.register("name")} />
        </div>

        <div className="pt-4 border-t border-subtle">
          <h3 className="text-emphasis font-medium mb-3">{t("thotis_data_consents")}</h3>
          <div className="flex items-center justify-between">
            <div className="mr-4">
              <p className="text-emphasis text-sm font-medium">{t("thotis_marketing_consent")}</p>
              <p className="text-subtle text-xs">{t("thotis_marketing_consent_desc")}</p>
            </div>
            <Switch checked={marketingConsent} onCheckedChange={setMarketingConsent} />
          </div>
          <p className="text-subtle text-xs mt-4">{t("thotis_gdpr_note")}</p>
        </div>

        <div className="pt-4">
          <Button type="submit" loading={updateProfileMutation.isPending}>
            {t("save_changes")}
          </Button>
        </div>
      </Form>
    </div>
  );
};
