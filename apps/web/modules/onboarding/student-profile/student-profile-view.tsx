"use client";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import { ZUpdateStudentProfileInputSchema } from "@calcom/trpc/server/routers/viewer/me/updateStudentProfile.schema";
import { Button } from "@calcom/ui/components/button";
import { Form, SelectField, TextAreaField, TextField } from "@calcom/ui/components/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { z } from "zod";

type StudentProfileFormValues = z.infer<typeof ZUpdateStudentProfileInputSchema>;

export const StudentProfileView = () => {
  const router = useRouter();
  const { t } = useLocale();
  const utils = trpc.useUtils();

  const mutation = trpc.viewer.me.updateStudentProfile.useMutation({
    onSuccess: () => {
      // Invalidate relevant queries if needed
      utils.viewer.me.get.invalidate();
      // Redirect to next step (personal settings or getting started)
      router.push("/onboarding/personal/settings");
    },
  });

  const formMethods = useForm<StudentProfileFormValues>({
    resolver: zodResolver(ZUpdateStudentProfileInputSchema),
    defaultValues: {
      university: "",
      degree: "",
      currentYear: 1,
      bio: "",
      field: "OTHER" as const,
    },
  });

  const academicFieldOptions = [
    { label: "Droit", value: "LAW" },
    { label: "Médecine", value: "MEDICINE" },
    { label: "Ingénierie", value: "ENGINEERING" },
    { label: "Commerce / Business", value: "BUSINESS" },
    { label: "Informatique", value: "COMPUTER_SCIENCE" },
    { label: "Psychologie", value: "PSYCHOLOGY" },
    { label: "Éducation", value: "EDUCATION" },
    { label: "Arts", value: "ARTS" },
    { label: "Sciences", value: "SCIENCES" },
    { label: "Autre", value: "OTHER" },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-2">Profil Ambassadeur</h1>
        <p className="text-gray-600 mb-8">
          Complétez votre profil pour aider les lycéens à mieux comprendre votre parcours.
        </p>

        <Form
          form={formMethods}
          handleSubmit={(values) => {
            mutation.mutate(values);
          }}
          className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Université / École"
              placeholder="Ex: HEC Paris, Sorbonne, etc."
              {...formMethods.register("university")}
            />
            <TextField
              label="Diplôme visé / actuel"
              placeholder="Ex: Master 2 Marketing"
              {...formMethods.register("degree")}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Domaine d'études"
              options={academicFieldOptions}
              value={academicFieldOptions.find((opt) => opt.value === formMethods.watch("field"))}
              onChange={(option) => {
                if (option) formMethods.setValue("field", option.value as StudentProfileFormValues["field"]);
              }}
            />
            <TextField
              label="Année d'étude (1-10)"
              type="number"
              min={1}
              max={10}
              {...formMethods.register("currentYear", { valueAsNumber: true })}
            />
          </div>

          <TextAreaField
            label="Bio / Présentation"
            placeholder="Racontez votre parcours, ce que vous aimez dans vos études, et comment vous pouvez aider..."
            rows={4}
            {...formMethods.register("bio")}
          />

          <div className="flex justify-end pt-4">
            <Button type="submit" loading={mutation.isPending}>
              Continuer
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};
