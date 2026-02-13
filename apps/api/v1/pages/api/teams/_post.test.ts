/**
 * Unit Tests for team creation endpoint
 *
 * These tests verify that team creation works without payment requirements
 * after EE removal (Requirement 3.1)
 */

import { HttpError } from "@calcom/lib/http-error";
import { MembershipRole } from "@calcom/prisma/enums";
import type { Request, Response } from "express";
import type { NextApiRequest, NextApiResponse } from "next";
import { createMocks } from "node-mocks-http";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock prisma
const mockPrismaTeamFindFirst = vi.fn();
const mockPrismaTeamCreate = vi.fn();

vi.mock("@calcom/prisma", () => ({
  prisma: {
    team: {
      findFirst: mockPrismaTeamFindFirst,
      create: mockPrismaTeamCreate,
    },
  },
  default: {
    team: {
      findFirst: mockPrismaTeamFindFirst,
      create: mockPrismaTeamCreate,
    },
  },
}));

// Mock the defaultResponder to extract the handler
vi.mock("@calcom/lib/server/defaultResponder", () => ({
  defaultResponder: (handler: any) => handler,
}));

type CustomNextApiRequest = NextApiRequest & Request & { userId: number; isSystemWideAdmin: boolean };
type CustomNextApiResponse = NextApiResponse & Response;

afterEach(() => {
  vi.resetAllMocks();
});

describe("Team Creation Without Billing - Unit Tests", () => {
  beforeEach(() => {
    mockPrismaTeamFindFirst.mockReset();
    mockPrismaTeamCreate.mockReset();
  });

  it("should create a team without payment requirements", async () => {
    const { req, res } = createMocks<CustomNextApiRequest, CustomNextApiResponse>({
      method: "POST",
      body: {
        name: "Test Team",
        slug: "test-team",
        hideBookATeamMember: false,
        brandColor: "#292929",
        darkBrandColor: "#fafafa",
        timeZone: "America/New_York",
        weekStart: "Sunday",
        isPrivate: false,
        rrResetInterval: "MONTH",
        rrTimestampBasis: "CREATED_AT",
        logoUrl: "https://example.com/logo.png",
        calVideoLogo: "https://example.com/cal-video.png",
        appLogo: "https://example.com/app.png",
        appIconLogo: "https://example.com/icon.png",
        bio: "Test team bio",
        hideTeamProfileLink: false,
        theme: "light",
        bannerUrl: "https://example.com/banner.png",
        parentId: null,
        timeFormat: 12,
        createdByOAuthClientId: null,
        autoOptInFeatures: false,
      },
    });

    // Set required properties
    req.userId = 1;
    req.isSystemWideAdmin = false;

    // Mock slug availability check
    mockPrismaTeamFindFirst.mockResolvedValue(null);

    // Mock team creation
    const mockTeam = {
      id: 1,
      name: "Test Team",
      slug: "test-team",
      hideBookATeamMember: false,
      brandColor: "#292929",
      darkBrandColor: "#fafafa",
      timeZone: "America/New_York",
      weekStart: "Sunday",
      isPrivate: false,
      smsLockReviewedByAdmin: false,
      rrResetInterval: "MONTH",
      rrTimestampBasis: "CREATED_AT",
      logoUrl: "https://example.com/logo.png",
      calVideoLogo: "https://example.com/cal-video.png",
      appLogo: "https://example.com/app.png",
      appIconLogo: "https://example.com/icon.png",
      bio: "Test team bio",
      hideTeamProfileLink: false,
      theme: "light",
      bannerUrl: "https://example.com/banner.png",
      parentId: null,
      timeFormat: 12,
      createdByOAuthClientId: null,
      autoOptInFeatures: false,
      hideBranding: false,
      isOrganization: false,
      pendingPayment: false,
      isPlatform: false,
      smsLockState: "REVIEW_NEEDED",
      metadata: null,
      bookingLimits: null,
      includeManagedEventsInLimits: false,
      createdAt: new Date(),
      members: [
        {
          id: 1,
          userId: 1,
          teamId: 1,
          role: MembershipRole.OWNER,
          accepted: true,
          customRoleId: null,
          disableImpersonation: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    mockPrismaTeamCreate.mockResolvedValue(mockTeam as any);

    // Import and call the handler
    const postHandler = await import("./_post");
    await postHandler.default(req, res);

    // Verify team was created without payment checks
    expect(mockPrismaTeamCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Test Team",
        slug: "test-team",
        smsLockReviewedByAdmin: false,
        members: {
          create: {
            userId: 1,
            role: MembershipRole.OWNER,
            accepted: true,
          },
        },
      }),
      include: { members: true },
    });

    // Verify response
    expect(req.statusCode).toBe(201);
  });

  it("should allow team creation for regular users without billing", async () => {
    const { req, res } = createMocks<CustomNextApiRequest, CustomNextApiResponse>({
      method: "POST",
      body: {
        name: "User Team",
        slug: "user-team",
        hideBookATeamMember: true,
        brandColor: "#000000",
        darkBrandColor: "#ffffff",
        timeZone: "UTC",
        weekStart: "Monday",
        isPrivate: true,
        rrResetInterval: "DAY",
        rrTimestampBasis: "START_TIME",
        logoUrl: "https://example.com/user-logo.png",
        calVideoLogo: "https://example.com/user-cal.png",
        appLogo: "https://example.com/user-app.png",
        appIconLogo: "https://example.com/user-icon.png",
        bio: "User team bio",
        hideTeamProfileLink: true,
        theme: "dark",
        bannerUrl: "https://example.com/user-banner.png",
        parentId: null,
        timeFormat: 24,
        createdByOAuthClientId: null,
        autoOptInFeatures: true,
      },
    });

    req.userId = 42;
    req.isSystemWideAdmin = false;

    mockPrismaTeamFindFirst.mockResolvedValue(null);

    const mockTeam = {
      id: 2,
      name: "User Team",
      slug: "user-team",
      hideBookATeamMember: true,
      brandColor: "#000000",
      darkBrandColor: "#ffffff",
      timeZone: "UTC",
      weekStart: "Monday",
      isPrivate: true,
      smsLockReviewedByAdmin: false,
      rrResetInterval: "DAY",
      rrTimestampBasis: "START_TIME",
      logoUrl: "https://example.com/user-logo.png",
      calVideoLogo: "https://example.com/user-cal.png",
      appLogo: "https://example.com/user-app.png",
      appIconLogo: "https://example.com/user-icon.png",
      bio: "User team bio",
      hideTeamProfileLink: true,
      theme: "dark",
      bannerUrl: "https://example.com/user-banner.png",
      parentId: null,
      timeFormat: 24,
      createdByOAuthClientId: null,
      autoOptInFeatures: true,
      hideBranding: false,
      isOrganization: false,
      pendingPayment: false,
      isPlatform: false,
      smsLockState: "REVIEW_NEEDED",
      metadata: null,
      bookingLimits: null,
      includeManagedEventsInLimits: false,
      createdAt: new Date(),
      members: [
        {
          id: 2,
          userId: 42,
          teamId: 2,
          role: MembershipRole.OWNER,
          accepted: true,
          customRoleId: null,
          disableImpersonation: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    mockPrismaTeamCreate.mockResolvedValue(mockTeam as any);

    const postHandler = await import("./_post");
    await postHandler.default(req, res);

    // Verify team creation succeeded for regular user
    expect(mockPrismaTeamCreate).toHaveBeenCalled();
    expect(req.statusCode).toBe(201);

    const createCall = mockPrismaTeamCreate.mock.calls[0][0];
    expect(createCall.data.members).toEqual({
      create: {
        userId: 42,
        role: MembershipRole.OWNER,
        accepted: true,
      },
    });
  });

  it("should reject duplicate team slugs", async () => {
    const { req, res } = createMocks<CustomNextApiRequest, CustomNextApiResponse>({
      method: "POST",
      body: {
        name: "Duplicate Team",
        slug: "existing-slug",
        hideBookATeamMember: false,
        brandColor: "#292929",
        darkBrandColor: "#fafafa",
        timeZone: "UTC",
        weekStart: "Monday",
        isPrivate: false,
        rrResetInterval: "MONTH",
        rrTimestampBasis: "CREATED_AT",
        logoUrl: "https://example.com/logo.png",
        calVideoLogo: "https://example.com/cal.png",
        appLogo: "https://example.com/app.png",
        appIconLogo: "https://example.com/icon.png",
        bio: "Duplicate bio",
        hideTeamProfileLink: false,
        theme: "light",
        bannerUrl: "https://example.com/banner.png",
        parentId: null,
        timeFormat: 12,
        createdByOAuthClientId: null,
        autoOptInFeatures: false,
      },
    });

    req.userId = 1;
    req.isSystemWideAdmin = false;

    // Mock existing team with same slug
    mockPrismaTeamFindFirst.mockResolvedValue({
      id: 999,
      slug: "existing-slug",
    } as any);

    const postHandler = await import("./_post");

    await expect(postHandler.default(req, res)).rejects.toThrow(HttpError);
    await expect(postHandler.default(req, res)).rejects.toThrow("Team slug already exists");
  });

  it("should allow admin to create team for another user", async () => {
    const { req, res } = createMocks<CustomNextApiRequest, CustomNextApiResponse>({
      method: "POST",
      body: {
        name: "Admin Created Team",
        slug: "admin-team",
        ownerId: 100,
        hideBookATeamMember: false,
        brandColor: "#292929",
        darkBrandColor: "#fafafa",
        timeZone: "UTC",
        weekStart: "Monday",
        isPrivate: false,
        rrResetInterval: "MONTH",
        rrTimestampBasis: "CREATED_AT",
        logoUrl: "https://example.com/admin-logo.png",
        calVideoLogo: "https://example.com/admin-cal.png",
        appLogo: "https://example.com/admin-app.png",
        appIconLogo: "https://example.com/admin-icon.png",
        bio: "Admin team bio",
        hideTeamProfileLink: false,
        theme: "light",
        bannerUrl: "https://example.com/admin-banner.png",
        parentId: null,
        timeFormat: 12,
        createdByOAuthClientId: null,
        autoOptInFeatures: false,
      },
    });

    req.userId = 1;
    req.isSystemWideAdmin = true;

    mockPrismaTeamFindFirst.mockResolvedValue(null);

    const mockTeam = {
      id: 3,
      name: "Admin Created Team",
      slug: "admin-team",
      hideBookATeamMember: false,
      brandColor: "#292929",
      darkBrandColor: "#fafafa",
      timeZone: "UTC",
      weekStart: "Monday",
      isPrivate: false,
      smsLockReviewedByAdmin: false,
      rrResetInterval: "MONTH",
      rrTimestampBasis: "CREATED_AT",
      logoUrl: "https://example.com/admin-logo.png",
      calVideoLogo: "https://example.com/admin-cal.png",
      appLogo: "https://example.com/admin-app.png",
      appIconLogo: "https://example.com/admin-icon.png",
      bio: "Admin team bio",
      hideTeamProfileLink: false,
      theme: "light",
      bannerUrl: "https://example.com/admin-banner.png",
      parentId: null,
      timeFormat: 12,
      createdByOAuthClientId: null,
      autoOptInFeatures: false,
      hideBranding: false,
      isOrganization: false,
      pendingPayment: false,
      isPlatform: false,
      smsLockState: "REVIEW_NEEDED",
      metadata: null,
      bookingLimits: null,
      includeManagedEventsInLimits: false,
      createdAt: new Date(),
      members: [
        {
          id: 3,
          userId: 100,
          teamId: 3,
          role: MembershipRole.OWNER,
          accepted: true,
          customRoleId: null,
          disableImpersonation: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    mockPrismaTeamCreate.mockResolvedValue(mockTeam as any);

    const postHandler = await import("./_post");
    await postHandler.default(req, res);

    // Verify team was created for the specified owner
    const createCall = mockPrismaTeamCreate.mock.calls[0][0];
    expect(createCall.data.members).toEqual({
      create: {
        userId: 100,
        role: MembershipRole.OWNER,
        accepted: true,
      },
    });

    expect(req.statusCode).toBe(201);
  });

  it("should reject non-admin users trying to set ownerId", async () => {
    const { req, res } = createMocks<CustomNextApiRequest, CustomNextApiResponse>({
      method: "POST",
      body: {
        name: "Unauthorized Team",
        slug: "unauthorized-team",
        ownerId: 999,
        hideBookATeamMember: false,
        brandColor: "#292929",
        darkBrandColor: "#fafafa",
        timeZone: "UTC",
        weekStart: "Monday",
        isPrivate: false,
        rrResetInterval: "MONTH",
        rrTimestampBasis: "CREATED_AT",
        logoUrl: "https://example.com/unauth-logo.png",
        calVideoLogo: "https://example.com/unauth-cal.png",
        appLogo: "https://example.com/unauth-app.png",
        appIconLogo: "https://example.com/unauth-icon.png",
        bio: "Unauthorized team bio",
        hideTeamProfileLink: false,
        theme: "light",
        bannerUrl: "https://example.com/unauth-banner.png",
        parentId: null,
        timeFormat: 12,
        createdByOAuthClientId: null,
        autoOptInFeatures: false,
      },
    });

    req.userId = 1;
    req.isSystemWideAdmin = false;

    const postHandler = await import("./_post");

    await expect(postHandler.default(req, res)).rejects.toThrow(HttpError);
    await expect(postHandler.default(req, res)).rejects.toThrow("ADMIN required for `ownerId`");
  });
});
