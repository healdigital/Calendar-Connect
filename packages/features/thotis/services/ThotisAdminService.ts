import process from "node:process";
import dayjs from "@calcom/dayjs";
import { sendPasswordResetEmail } from "@calcom/emails/auth-email-service";
import { PASSWORD_RESET_EXPIRY_HOURS } from "@calcom/features/auth/lib/passwordResetRequest";
import { ErrorCode } from "@calcom/lib/errorCodes";
import { ErrorWithCode } from "@calcom/lib/errors";
import { getTranslation } from "@calcom/lib/server/i18n";
import { prisma } from "@calcom/prisma";
import type { Prisma } from "@calcom/prisma/client";
import type { AcademicField } from "@calcom/prisma/enums";
import { ProfileRepository } from "../repositories/ProfileRepository";
import { ProfileService } from "./ProfileService";

export interface ProvisionAmbassadorInput {
  name: string;
  email: string;
  fieldOfStudy: string;
  university: string;
  degree: string;
  yearOfStudy: number;
  bio: string;
}

export class ThotisAdminService {
  private profileService: ProfileService;
  private profileRepository: ProfileRepository;

  constructor(profileService?: ProfileService, profileRepository?: ProfileRepository) {
    this.profileRepository = profileRepository || new ProfileRepository();
    this.profileService = profileService || new ProfileService(this.profileRepository);
  }

  /**
   * Provision a new ambassador account and profile.
   * If user doesn't exist, creates one. Then creates the student profile.
   */
  async provisionAmbassador(input: ProvisionAmbassadorInput) {
    // 1. Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true, email: true, name: true, locale: true, timeZone: true },
    });

    if (!user) {
      // Create user if not exists
      user = await prisma.user.create({
        data: {
          email: input.email,
          name: input.name,
          username: input.email
            .split("@")[0]
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "-"),
        },
        select: { id: true, email: true, name: true, locale: true, timeZone: true },
      });
    }

    // 2. Create Student Profile via ProfileService
    try {
      const profile = await this.profileService.createProfile({
        userId: user.id,
        fieldOfStudy: input.fieldOfStudy,
        yearOfStudy: input.yearOfStudy,
        bio: input.bio,
        university: input.university,
        degree: input.degree,
      });

      // 3. Create Default Schedule for the user (Mon-Fri, 9:00-17:00)
      const defaultSchedule = await prisma.schedule.create({
        data: {
          userId: user.id,
          name: "Default Schedule",
          timeZone: user.timeZone || "Europe/Paris",
          availability: {
            createMany: {
              data: [
                {
                  days: [1, 2, 3, 4, 5],
                  startTime: new Date("1970-01-01T09:00:00Z"),
                  endTime: new Date("1970-01-01T17:00:00Z"),
                },
              ],
            },
          },
        },
      });

      // Set as default schedule
      await prisma.user.update({
        where: { id: user.id },
        data: { defaultScheduleId: defaultSchedule.id },
      });

      // 4. Send password reset email so they can set their password
      await this.sendInitialPasswordSetup(user.id);

      return profile;
    } catch (error) {
      if (
        error instanceof ErrorWithCode &&
        error.code === ErrorCode.BadRequest &&
        error.message.includes("already exists")
      ) {
        // Profile already exists, just return it or update it?
        // For provisioning, we expect it to be new.
        throw error;
      }
      throw error;
    }
  }

  /**
   * Send a password reset email for initial setup or admin-triggered reset.
   */
  async sendInitialPasswordSetup(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, locale: true },
    });

    if (!user) throw new ErrorWithCode(ErrorCode.NotFound, "User not found");

    const t = await getTranslation(user.locale ?? "en", "common");
    const expiry = dayjs().add(PASSWORD_RESET_EXPIRY_HOURS, "hours").toDate();

    const passwordResetToken = await prisma.resetPasswordRequest.create({
      data: {
        email: user.email,
        expires: expiry,
      },
    });

    const resetLink = `${process.env.NEXT_PUBLIC_WEBAPP_URL}/auth/forgot-password/${passwordResetToken.id}`;

    await sendPasswordResetEmail({
      language: t,
      user: {
        name: user.name,
        email: user.email,
      },
      resetLink,
    });

    return { success: true };
  }

  /**
   * List all ambassadors with pagination and filters
   */
  async listAllAmbassadors(filters: {
    page?: number;
    pageSize?: number;
    fieldOfStudy?: string;
    isActive?: boolean;
  }) {
    // We can reuse searchProfiles but we might want to include INACTIVE ones here by default if admin
    // So we'll add a specific method to ProfileRepository or use prisma directly here if needed.
    // Let's use prisma for more flexibility in Admin listing.
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const where: Prisma.StudentProfileWhereInput = {};
    if (filters.fieldOfStudy) where.field = filters.fieldOfStudy as AcademicField;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    const [profiles, total] = await Promise.all([
      prisma.studentProfile.findMany({
        where,
        select: {
          id: true,
          userId: true,
          field: true,
          university: true,
          degree: true,
          currentYear: true,
          bio: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              name: true,
              email: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.studentProfile.count({ where }),
    ]);

    return {
      profiles,
      total,
      page,
      pageSize,
    };
  }

  /**
   * Toggle ambassador active status
   */
  async toggleAmbassadorStatus(profileId: string, isActive: boolean) {
    return await prisma.studentProfile.update({
      where: { id: profileId },
      data: { isActive },
    });
  }
}
