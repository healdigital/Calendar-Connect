import { useLocale } from "@calcom/lib/hooks/useLocale";
import { AcademicField } from "@calcom/prisma/enums";
import { trpc } from "@calcom/trpc/react";
import { Button } from "@calcom/ui/components/button/Button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@calcom/ui/components/dialog/Dialog";
import { Label, Select, Switch, TextField } from "@calcom/ui/components/form/inputs";
import { Table } from "@calcom/ui/components/table/Table";
import { showToast } from "@calcom/ui/components/toast/Toast";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { ProvisionAmbassadorInput } from "../services/ThotisAdminService";

export const AmbassadorManagement: React.FC = () => {
  const { t } = useLocale();
  const [fieldOfStudy, setFieldOfStudy] = useState<string | undefined>(undefined);
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);

  const utils = trpc.useContext();

  const { data } = trpc.thotis.admin.listAmbassadors.useQuery({
    page: 1,
    fieldOfStudy,
  });

  const toggleStatusMutation = trpc.thotis.admin.toggleStatus.useMutation({
    onSuccess: () => {
      showToast(t("thotis_admin_status_updated_success"), "success");
      utils.thotis.admin.listAmbassadors.invalidate();
    },
    onError: (error) => {
      showToast(`${t("thotis_admin_error")}: ${error.message}`, "error");
    },
  });

  const resetPasswordMutation = trpc.thotis.admin.sendPasswordReset.useMutation({
    onSuccess: () => {
      showToast(t("thotis_admin_reset_link_sent"), "success");
    },
    onError: (error) => {
      showToast(`${t("thotis_admin_error")}: ${error.message}`, "error");
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t("thotis_admin_ambassadors_management")}</h2>
        <Button color="primary" onClick={() => setIsProvisionModalOpen(true)}>
          {t("thotis_admin_add_ambassador")}
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="w-64">
          <Select
            options={Object.values(AcademicField).map((f) => ({ label: f, value: f }))}
            onChange={(option) => setFieldOfStudy(option?.value)}
            placeholder={t("thotis_admin_filter_field")}
          />
        </div>
      </div>

      <Table>
        <Table.Header>
          <Table.ColumnTitle>{t("thotis_admin_ambassador")}</Table.ColumnTitle>
          <Table.ColumnTitle>{t("thotis_admin_field_university")}</Table.ColumnTitle>
          <Table.ColumnTitle>{t("thotis_admin_status")}</Table.ColumnTitle>
          <Table.ColumnTitle>{t("thotis_admin_actions")}</Table.ColumnTitle>
        </Table.Header>
        <Table.Body>
          {data?.profiles.map((profile) => (
            <Table.Row key={profile.id}>
              <Table.Cell>
                <div>
                  <div className="font-medium text-default">{profile.user.name}</div>
                  <div className="text-muted text-sm">{profile.user.email}</div>
                </div>
              </Table.Cell>
              <Table.Cell>
                <div>
                  <div className="text-default">{profile.field}</div>
                  <div className="text-muted text-xs">{profile.university}</div>
                </div>
              </Table.Cell>
              <Table.Cell>
                <Switch
                  checked={profile.isActive}
                  onCheckedChange={(checked) =>
                    toggleStatusMutation.mutate({ profileId: profile.id, isActive: checked })
                  }
                />
              </Table.Cell>
              <Table.Cell>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outlined"
                    onClick={() => resetPasswordMutation.mutate({ userId: profile.userId })}>
                    {t("thotis_admin_reset_password")}
                  </Button>
                </div>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>

      <ProvisionAmbassadorModal
        isOpen={isProvisionModalOpen}
        onClose={() => setIsProvisionModalOpen(false)}
      />
    </div>
  );
};

const ProvisionAmbassadorModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useLocale();
  const { register, handleSubmit, control, reset } = useForm<ProvisionAmbassadorInput>();
  const utils = trpc.useContext();

  const mutation = trpc.thotis.admin.createAmbassador.useMutation({
    onSuccess: () => {
      showToast(t("thotis_admin_created_success"), "success");
      utils.thotis.admin.listAmbassadors.invalidate();
      reset();
      onClose();
    },
    onError: (error) => {
      showToast(`${t("thotis_admin_error")}: ${error.message}`, "error");
    },
  });

  const onSubmit = (data: ProvisionAmbassadorInput) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("thotis_admin_provision_new_ambassador")}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4 py-4" onSubmit={handleSubmit(onSubmit)}>
          <TextField label={t("thotis_admin_full_name")} {...register("name", { required: true })} />
          <TextField
            label={t("thotis_admin_email")}
            type="email"
            {...register("email", { required: true })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="fieldOfStudy"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <div className="space-y-1">
                  <Label>{t("thotis_admin_field")}</Label>
                  <Select
                    options={Object.values(AcademicField).map((f) => ({ label: f, value: f }))}
                    onChange={(opt) => field.onChange(opt?.value)}
                  />
                </div>
              )}
            />
            <TextField
              label={t("thotis_admin_study_year")}
              type="number"
              {...register("yearOfStudy", { required: true, valueAsNumber: true })}
            />
          </div>

          <TextField label={t("thotis_admin_university")} {...register("university", { required: true })} />
          <TextField label={t("thotis_admin_degree")} {...register("degree", { required: true })} />

          <div className="space-y-1">
            <Label>{t("thotis_admin_bio")}</Label>
            <textarea
              className="bg-default border-subtle w-full rounded-md border p-2"
              rows={3}
              {...register("bio", { required: true })}
            />
          </div>

          <DialogFooter>
            <Button onClick={onClose} variant="outlined">
              {t("cancel")}
            </Button>
            <Button type="submit" loading={mutation.isLoading}>
              {t("thotis_admin_create_account")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
