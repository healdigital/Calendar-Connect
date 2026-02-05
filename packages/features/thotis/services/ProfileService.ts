import process from "node:process";
import { ErrorCode } from "@calcom/lib/errorCodes";
import { ErrorWithCode } from "@calcom/lib/errors";
import type { AcademicField } from "@calcom/prisma/enums";
import sharp from "sharp";
import { RedisService } from "../../redis/RedisService";
import { ProfileRepository } from "../repositories/ProfileRepository";
import { AnalyticsService } from "./AnalyticsService";

export interface CreateProfileInput {
  userId: number;
  fieldOfStudy: string;
  yearOfStudy: number;
  bio: string;
  university: string;
  degree: string;
  profilePhotoUrl?: string;
}

export interface UpdateProfileInput {
  fieldOfStudy?: string;
  yearOfStudy?: number;
  bio?: string;
  university?: string;
  degree?: string;
  profilePhotoUrl?: string;
  isActive?: boolean;
}

export interface ProfileSearchFilters {
  fieldOfStudy?: string;
  university?: string;
  minRating?: number;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export class ProfileService {
  private repository: ProfileRepository;
  private redis?: RedisService;
  private analytics: AnalyticsService;
  private readonly PROFILE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly LIST_CACHE_TTL = 1 * 60 * 1000; // 1 minute
  private readonly PROFILE_PHOTO_SIZE = 400; // 400x400 pixels
  private readonly MAX_BIO_LENGTH = 1000;
  private readonly MIN_YEAR_OF_STUDY = 1;
  private readonly MAX_YEAR_OF_STUDY = 10;

  constructor(repository?: ProfileRepository, redis?: RedisService, analytics?: AnalyticsService) {
    this.repository = repository || new ProfileRepository();
    this.analytics = analytics || new AnalyticsService();
    this.redis = redis;

    // Try to initialize Redis if not provided and env vars exist
    if (!this.redis && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        this.redis = new RedisService();
      } catch (e) {
        console.warn("Failed to initialize RedisService", e);
      }
    }
  }

  private normalizeUrl(url: string): string {
    if (!url) return url;
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `https://${url}`;
  }

  private validateCreateInput(input: CreateProfileInput): void {
    if (!input.userId || input.userId <= 0) {
      throw new ErrorWithCode(ErrorCode.BadRequest, "Invalid userId");
    }

    if (!input.fieldOfStudy || input.fieldOfStudy.trim().length === 0) {
      throw new ErrorWithCode(ErrorCode.BadRequest, "Field of study is required");
    }

    if (
      !input.yearOfStudy ||
      input.yearOfStudy < this.MIN_YEAR_OF_STUDY ||
      input.yearOfStudy > this.MAX_YEAR_OF_STUDY
    ) {
      throw new ErrorWithCode(
        ErrorCode.BadRequest,
        `Year of study must be between ${this.MIN_YEAR_OF_STUDY} and ${this.MAX_YEAR_OF_STUDY}`
      );
    }

    if (!input.bio || input.bio.trim().length === 0) {
      throw new ErrorWithCode(ErrorCode.BadRequest, "Bio is required");
    }

    if (input.bio.length > this.MAX_BIO_LENGTH) {
      throw new ErrorWithCode(ErrorCode.BadRequest, `Bio must not exceed ${this.MAX_BIO_LENGTH} characters`);
    }

    if (!input.university || input.university.trim().length === 0) {
      throw new ErrorWithCode(ErrorCode.BadRequest, "University is required");
    }

    if (!input.degree || input.degree.trim().length === 0) {
      throw new ErrorWithCode(ErrorCode.BadRequest, "Degree is required");
    }
  }

  private validateUpdateInput(input: UpdateProfileInput): void {
    if (input.fieldOfStudy !== undefined && input.fieldOfStudy.trim().length === 0) {
      throw new ErrorWithCode(ErrorCode.BadRequest, "Field of study cannot be empty");
    }

    if (
      input.yearOfStudy !== undefined &&
      (input.yearOfStudy < this.MIN_YEAR_OF_STUDY || input.yearOfStudy > this.MAX_YEAR_OF_STUDY)
    ) {
      throw new ErrorWithCode(
        ErrorCode.BadRequest,
        `Year of study must be between ${this.MIN_YEAR_OF_STUDY} and ${this.MAX_YEAR_OF_STUDY}`
      );
    }

    if (input.bio !== undefined) {
      if (input.bio.trim().length === 0) {
        throw new ErrorWithCode(ErrorCode.BadRequest, "Bio cannot be empty");
      }
      if (input.bio.length > this.MAX_BIO_LENGTH) {
        throw new ErrorWithCode(
          ErrorCode.BadRequest,
          `Bio must not exceed ${this.MAX_BIO_LENGTH} characters`
        );
      }
    }
  }

  async resizeProfilePhoto(photoBuffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(photoBuffer)
        .resize(this.PROFILE_PHOTO_SIZE, this.PROFILE_PHOTO_SIZE, {
          fit: "cover",
          position: "center",
        })
        .jpeg({ quality: 85 })
        .toBuffer();
    } catch (error) {
      throw new ErrorWithCode(ErrorCode.InternalServerError, "Failed to process profile photo");
    }
  }

  async createProfile(input: CreateProfileInput) {
    this.validateCreateInput(input);

    const profilePhotoUrl = input.profilePhotoUrl ? this.normalizeUrl(input.profilePhotoUrl) : undefined;

    try {
      const profile = await this.repository.createProfile(input.userId, {
        university: input.university.trim(),
        degree: input.degree.trim(),
        field: input.fieldOfStudy as AcademicField,
        currentYear: input.yearOfStudy,
        bio: input.bio.trim(),
        profilePhotoUrl,
      });

      if (this.redis) {
        await this.redis.set(`profile:${profile.userId}`, profile, { ttl: this.PROFILE_CACHE_TTL });
      }

      this.analytics.trackProfileCreated({
        userId: profile.userId,
        field: profile.field,
        university: profile.university,
        degree: profile.degree,
      });

      return profile;
    } catch (error) {
      if (error instanceof Error && error.message.includes("Unique constraint")) {
        throw new ErrorWithCode(ErrorCode.BadRequest, "Profile already exists for this user");
      }
      throw error;
    }
  }

  async updateProfile(userId: number, input: UpdateProfileInput) {
    this.validateUpdateInput(input);

    // Get existing profile to find ID
    const existing = await this.repository.getProfileByUserId(userId);
    if (!existing) {
      throw new ErrorWithCode(ErrorCode.NotFound, "Profile not found");
    }

    const updateData: {
      field?: AcademicField;
      currentYear?: number;
      bio?: string;
      university?: string;
      degree?: string;
      profilePhotoUrl?: string | null;
      isActive?: boolean;
    } = {};

    if (input.fieldOfStudy !== undefined) updateData.field = input.fieldOfStudy as AcademicField;
    if (input.yearOfStudy !== undefined) updateData.currentYear = input.yearOfStudy;
    if (input.bio !== undefined) updateData.bio = input.bio.trim();
    if (input.university !== undefined) updateData.university = input.university.trim();
    if (input.degree !== undefined) updateData.degree = input.degree.trim();
    if (input.profilePhotoUrl !== undefined)
      updateData.profilePhotoUrl = this.normalizeUrl(input.profilePhotoUrl);
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    const profile = await this.repository.updateProfile(existing.id, updateData);

    if (profile && this.redis) {
      await this.redis.set(`profile:${userId}`, profile, { ttl: this.PROFILE_CACHE_TTL });
    }

    return profile;
  }

  async getProfile(userId: number) {
    if (this.redis) {
      const cached = await this.redis.get(`profile:${userId}`);
      if (cached) return cached;
    }

    const profile = await this.repository.getProfileByUserId(userId);

    if (profile && this.redis) {
      await this.redis.set(`profile:${userId}`, profile, { ttl: this.PROFILE_CACHE_TTL });
    }

    return profile;
  }

  async getProfilesByField(fieldOfStudy: string) {
    const cacheKey = `field:${fieldOfStudy}`;
    if (this.redis) {
      const cached = await this.redis.get(cacheKey);
      if (cached) return cached as any[];
    }

    const result = await this.repository.getProfilesByField(fieldOfStudy as AcademicField, { pageSize: 100 });
    const profiles = result.profiles;

    if (this.redis) {
      await this.redis.set(cacheKey, profiles, { ttl: this.LIST_CACHE_TTL });
    }

    return profiles;
  }

  async searchProfiles(filters: ProfileSearchFilters) {
    const cacheKey = `search:${JSON.stringify(filters)}`;
    if (this.redis) {
      const cached = await this.redis.get(cacheKey);
      if (cached) return cached as any[];
    }

    const result = await this.repository.searchProfiles({
      field: filters.fieldOfStudy as AcademicField,
      university: filters.university,
      minRating: filters.minRating,
      page: filters.page,
      pageSize: filters.pageSize,
    });

    const profiles = result.profiles;

    if (this.redis) {
      await this.redis.set(cacheKey, profiles, { ttl: this.LIST_CACHE_TTL });
    }

    return profiles;
  }

  async activateProfile(userId: number) {
    return this.updateProfile(userId, { isActive: true });
  }

  async deactivateProfile(userId: number) {
    return this.updateProfile(userId, { isActive: false });
  }

  isProfileComplete(profile: any): boolean {
    return (
      profile.bio !== null &&
      profile.field !== null &&
      profile.currentYear !== null &&
      profile.university !== null
    );
  }
}
