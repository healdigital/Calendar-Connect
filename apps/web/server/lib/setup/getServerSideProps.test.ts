import type { GetServerSidePropsContext } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies before imports
vi.mock("@calcom/features/auth/lib/getServerSession", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@calcom/prisma", () => ({
  default: {
    user: {
      count: vi.fn(),
    },
  },
}));

import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import prisma from "@calcom/prisma";
import { UserPermissionRole } from "@calcom/prisma/enums";
import { getServerSideProps } from "./getServerSideProps";

const mockGetServerSession = vi.mocked(getServerSession);
const mockPrisma = prisma as unknown as {
  user: {
    count: ReturnType<typeof vi.fn>;
  };
};

function createMockContext(overrides: Partial<GetServerSidePropsContext> = {}): GetServerSidePropsContext {
  return {
    req: { headers: {} } as GetServerSidePropsContext["req"],
    res: {} as GetServerSidePropsContext["res"],
    params: {},
    query: {},
    resolvedUrl: "/auth/setup",
    ...overrides,
  };
}

describe("Setup getServerSideProps without license validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("User count retrieval", () => {
    it("should return user count when no session exists", async () => {
      const ctx = createMockContext();
      mockGetServerSession.mockResolvedValue(null);
      mockPrisma.user.count.mockResolvedValue(5);

      const result = await getServerSideProps(ctx);

      expect(result).toEqual({
        props: {
          userCount: 5,
        },
      });
      expect(mockPrisma.user.count).toHaveBeenCalledOnce();
    });

    it("should return user count of 0 when no users exist", async () => {
      const ctx = createMockContext();
      mockGetServerSession.mockResolvedValue(null);
      mockPrisma.user.count.mockResolvedValue(0);

      const result = await getServerSideProps(ctx);

      expect(result).toEqual({
        props: {
          userCount: 0,
        },
      });
    });
  });

  describe("Admin role validation", () => {
    it("should return notFound when user is not an admin", async () => {
      const ctx = createMockContext();
      mockGetServerSession.mockResolvedValue({
        user: { role: UserPermissionRole.USER },
        hasValidLicense: true,
        upId: "test",
        expires: "2024-12-31",
      } as any);
      mockPrisma.user.count.mockResolvedValue(10);

      const result = await getServerSideProps(ctx);

      expect(result).toEqual({
        notFound: true,
      });
    });

    it("should return props when user is an admin", async () => {
      const ctx = createMockContext();
      mockGetServerSession.mockResolvedValue({
        user: { role: UserPermissionRole.ADMIN },
        hasValidLicense: true,
        upId: "test",
        expires: "2024-12-31",
      } as any);
      mockPrisma.user.count.mockResolvedValue(10);

      const result = await getServerSideProps(ctx);

      expect(result).toEqual({
        props: {
          userCount: 10,
        },
      });
    });

    it("should return props when session exists but has no role (no user logged in)", async () => {
      const ctx = createMockContext();
      mockGetServerSession.mockResolvedValue({
        user: {},
        hasValidLicense: true,
        upId: "test",
        expires: "2024-12-31",
      } as any);
      mockPrisma.user.count.mockResolvedValue(3);

      const result = await getServerSideProps(ctx);

      expect(result).toEqual({
        props: {
          userCount: 3,
        },
      });
    });
  });

  describe("No license validation", () => {
    it("should work without checking for LicenseKeySingleton", async () => {
      const ctx = createMockContext();
      mockGetServerSession.mockResolvedValue(null);
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await getServerSideProps(ctx);

      // Should succeed without any license validation
      expect(result).toEqual({
        props: {
          userCount: 1,
        },
      });
      // Verify no license-related mocks were called
      expect(mockGetServerSession).toHaveBeenCalledOnce();
      expect(mockPrisma.user.count).toHaveBeenCalledOnce();
    });

    it("should not require license validation for setup flow", async () => {
      const ctx = createMockContext();
      mockGetServerSession.mockResolvedValue(null);
      mockPrisma.user.count.mockResolvedValue(0);

      // This should work without any license checks
      const result = await getServerSideProps(ctx);

      expect(result).toHaveProperty("props");
      expect(result).not.toHaveProperty("redirect");
      expect((result as any).props.userCount).toBe(0);
    });
  });

  describe("Error handling", () => {
    it("should handle database errors gracefully", async () => {
      const ctx = createMockContext();
      mockGetServerSession.mockResolvedValue(null);
      mockPrisma.user.count.mockRejectedValue(new Error("Database connection failed"));

      await expect(getServerSideProps(ctx)).rejects.toThrow("Database connection failed");
    });

    it("should handle session retrieval errors", async () => {
      const ctx = createMockContext();
      mockGetServerSession.mockRejectedValue(new Error("Session error"));
      mockPrisma.user.count.mockResolvedValue(5);

      await expect(getServerSideProps(ctx)).rejects.toThrow("Session error");
    });
  });
});
