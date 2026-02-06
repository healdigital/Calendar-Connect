import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import { Button, Dialog, DialogContent, Form, Icon, Label, showToast, TextArea, TextField } from "@calcom/ui";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";

interface Resource {
  type: "LINK" | "FILE";
  title: string;
  url: string;
}

interface PostSessionFormData {
  content: string;
  nextSteps: string;
  resources: Resource[];
}

interface PostSessionFormProps {
  bookingId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PostSessionForm({ bookingId, open, onOpenChange }: PostSessionFormProps) {
  const { t } = useLocale();
  const utils = trpc.useUtils();
  const { data: initialData, isPending } = trpc.thotis.booking.getPostSessionData.useQuery(
    { bookingId },
    { enabled: open }
  );

  const mutation = trpc.thotis.booking.submitPostSessionData.useMutation({
    onSuccess: () => {
      showToast(t("thotis_session_summary_saved"), "success");
      onOpenChange(false);
      utils.thotis.booking.mentorSessions.invalidate();
      utils.thotis.booking.getPostSessionData.invalidate({ bookingId });
    },
    onError: (err) => {
      showToast(err.message, "error");
    },
  });

  const form = useForm<PostSessionFormData>({
    defaultValues: {
      content: "",
      nextSteps: "",
      resources: [],
    },
  });

  // Load initial data when available
  useEffect(() => {
    if (initialData) {
      form.reset({
        content: initialData.summary?.content || "",
        nextSteps: initialData.summary?.nextSteps || "",
        resources: (initialData.resources as Resource[]) || [],
      });
    }
  }, [initialData, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "resources",
  });

  const onSubmit = (data: PostSessionFormData) => {
    mutation.mutate({
      bookingId,
      content: data.content,
      nextSteps: data.nextSteps || undefined,
      resources: data.resources,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl"
        title={t("thotis_post_session_summary")}
        description={t("thotis_post_session_desc")}>
        {isPending ? (
          <div className="flex justify-center p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-600" />
          </div>
        ) : (
          <Form form={form} handleSubmit={onSubmit} className="space-y-4">
            <div>
              <Label>{t("thotis_summary_discussion")}</Label>
              <TextArea
                {...form.register("content", { required: true })}
                placeholder={t("thotis_summary_placeholder")}
                className="h-32"
              />
            </div>

            <div>
              <Label>{t("thotis_next_steps")}</Label>
              <TextArea
                {...form.register("nextSteps")}
                placeholder={t("thotis_action_plan_placeholder")}
                className="h-24"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>{t("thotis_resources")}</Label>
                <Button
                  color="secondary"
                  size="sm"
                  StartIcon="plus"
                  onClick={() => append({ type: "LINK", title: "", url: "" })}
                  type="button">
                  {t("thotis_add_resource")}
                </Button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-start border p-3 rounded-md">
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <select
                          {...form.register(`resources.${index}.type`)}
                          className="rounded-md border border-gray-300 p-2 text-sm max-w-[100px]">
                          <option value="LINK">Link</option>
                          <option value="FILE">File</option>
                        </select>
                        <TextField
                          {...form.register(`resources.${index}.title`, { required: true })}
                          placeholder={t("thotis_resource_title_placeholder")}
                          className="flex-1"
                        />
                      </div>
                      <TextField
                        {...form.register(`resources.${index}.url`, { required: true })}
                        placeholder={t("thotis_resource_url_placeholder")}
                        addOnLeading={
                          <Icon name={field.type === "LINK" ? "link" : "file-text"} className="h-4 w-4" />
                        }
                      />
                    </div>
                    <Button
                      color="destructive"
                      variant="icon"
                      StartIcon="trash"
                      onClick={() => remove(index)}
                      type="button"
                    />
                  </div>
                ))}
                {fields.length === 0 && (
                  <p className="text-sm text-gray-400 italic">{t("thotis_no_resources_yet")}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="button" color="secondary" onClick={() => onOpenChange(false)} className="mr-2">
                {t("thotis_back")}
              </Button>
              <Button type="submit" loading={mutation.isPending}>
                {t("thotis_save_summary")}
              </Button>
            </div>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
