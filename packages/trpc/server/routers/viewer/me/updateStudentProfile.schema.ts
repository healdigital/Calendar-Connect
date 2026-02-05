import { AcademicField } from "@calcom/prisma/enums";
import { z } from "zod";

export const ZUpdateStudentProfileInputSchema = z.object({
  university: z.string(),
  degree: z.string(),
  field: z.nativeEnum(AcademicField),
  currentYear: z.number().int().min(1).max(10),
  bio: z.string(),
  profilePhotoUrl: z.string().optional(),
  linkedInUrl: z.string().optional(),
});

export type TUpdateStudentProfileInputSchema = z.infer<typeof ZUpdateStudentProfileInputSchema>;
