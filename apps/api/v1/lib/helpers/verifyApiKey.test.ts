/**
 * Unit Tests for verifyApiKey middleware
 *
 * These tests verify the middleware logic without touching the database.
 * All dependencies (Prisma, utilities) are mocked.
 */

import { prisma } from "@calcom/prisma";
import { UserPermissionRole } from "@calcom/prisma/enums";
import type { Request, Response } from "express";
import type { NextApiRequest, NextApiResponse } from "next";
import { createMocks } from "node-mocks-http";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isAdminGuard } from "../utils/isAdmin";
import { isLockedOrBlocked } from "../utils/isLockedOrBlocked";
import { ScopeOfAdmin } from "../utils/scopeOfAdmin";
import { verifyApiKey } from "./verifyApiKey";

vi.mock("@calcom/prisma", () => ({
  prisma: {
    apiKey: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("../utils/isAdmin", () => ({
  isAdminGuard: vi.fn(),
}));

vi.mock("../utils/isLockedOrBlocked", () => ({
  isLockedOrBlocked: vi.fn(),
}));

type CustomNextApiRequest = NextApiRequest & Request;
type CustomNextApiResponse = NextApiResponse & Response;

afterEach(() => {
  vi.resetAllMocks();
});

describe("Verify API key - Unit Tests", () => {
  beforeEach(() => {
    vi.mocked(isAdminGuard).mockReset();
    vi.mocked(isLockedOrBlocked).mockReset();
    vi.mocked(prisma.apiKey.findUnique).mockReset();
    vi.mocked(prisma.apiKey.update).mockReset();
  });

  it("should throw an error if no api key is provided", async () => {
    const { req, res } = createMocks<CustomNextApiRequest, CustomNextApiResponse>({
      method: "POST",
      body: {},
    });

    const middleware = {
      fn: verifyApiKey,
    };

    const serverNext = vi.fn((next: void) => Promise.resolve(next));
    const middlewareSpy = vi.spyOn(middleware, "fn");

    await middleware.fn(req, res, serverNext);

    expect(middlewareSpy).toBeCalled();
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({ message: "No apiKey provided" });
  });

  it("should throw an error if the api key is not found", async () => {
    const { req, res } = createMocks<CustomNextApiRequest, CustomNextApiResponse>({
      method: "POST",
      body: {},
      query: {
        apiKey: "cal_invalid_key",
      },
    });

    vi.mocked(prisma.apiKey.findUnique).mockResolvedValue(null);

    const middleware = {
      fn: verifyApiKey,
    };

    const serverNext = vi.fn((next: void) => Promise.resolve(next));
    const middlewareSpy = vi.spyOn(middleware, "fn");

    await middleware.fn(req, res, serverNext);

    expect(middlewareSpy).toBeCalled();
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({ error: "API key not found" });
  });

  it("should throw an error if the api key is expired", async () => {
    const { req, res } = createMocks<CustomNextApiRequest, CustomNextApiResponse>({
      method: "POST",
      body: {},
      query: {
        apiKey: "cal_expired_key",
      },
    });

    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 1);

    vi.mocked(prisma.apiKey.findUnique).mockResolvedValue({
      id: "key-1",
      userId: 1,
      expiresAt: expiredDate,
      lastUsedAt: null,
      user: {
        id: 1,
        uuid: "test-uuid-1",
        email: "test@example.com",
        username: "testuser",
        name: "Test User",
        role: UserPermissionRole.USER,
        locked: false,
      },
    } as any);

    const middleware = {
      fn: verifyApiKey,
    };

    const serverNext = vi.fn((next: void) => Promise.resolve(next));
    const middlewareSpy = vi.spyOn(middleware, "fn");

    await middleware.fn(req, res, serverNext);

    expect(middlewareSpy).toBeCalled();
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({ error: "API key expired" });
  });

  it("should set correct permissions for system-wide admin", async () => {
    const { req, res } = createMocks<CustomNextApiRequest, CustomNextApiResponse>({
      method: "POST",
      body: {},
      query: {
        apiKey: "cal_test_key",
      },
    });

    vi.mocked(prisma.apiKey.findUnique).mockResolvedValue({
      id: "key-1",
      userId: 1,
      expiresAt: null,
      lastUsedAt: null,
      user: {
        id: 1,
        uuid: "test-uuid-1",
        email: "admin@example.com",
        username: "admin",
        name: "Admin User",
        role: UserPermissionRole.ADMIN,
        locked: false,
      },
    } as any);

    vi.mocked(prisma.apiKey.update).mockResolvedValue({} as any);

    vi.mocked(isAdminGuard).mockResolvedValue({
      isAdmin: true,
      scope: ScopeOfAdmin.SystemWide,
    });

    vi.mocked(isLockedOrBlocked).mockResolvedValue(false);

    const middleware = {
      fn: verifyApiKey,
    };

    const serverNext = vi.fn((next: void) => Promise.resolve(next));
    const middlewareSpy = vi.spyOn(middleware, "fn");

    await middleware.fn(req, res, serverNext);

    expect(middlewareSpy).toBeCalled();
    expect(req.isSystemWideAdmin).toBe(true);
    expect(req.isOrganizationOwnerOrAdmin).toBe(false);
    expect(serverNext).toHaveBeenCalled();
  });

  it("should set correct permissions for org-level admin", async () => {
    const { req, res } = createMocks<CustomNextApiRequest, CustomNextApiResponse>({
      method: "POST",
      body: {},
      query: {
        apiKey: "cal_test_key",
      },
    });

    vi.mocked(prisma.apiKey.findUnique).mockResolvedValue({
      id: "key-2",
      userId: 2,
      expiresAt: null,
      lastUsedAt: null,
      user: {
        id: 2,
        uuid: "test-uuid-2",
        email: "org-admin@acme.com",
        username: "orgadmin",
        name: "Org Admin",
        role: UserPermissionRole.USER,
        locked: false,
      },
    } as any);

    vi.mocked(prisma.apiKey.update).mockResolvedValue({} as any);

    vi.mocked(isAdminGuard).mockResolvedValue({
      isAdmin: true,
      scope: ScopeOfAdmin.OrgOwnerOrAdmin,
    });

    vi.mocked(isLockedOrBlocked).mockResolvedValue(false);

    const middleware = {
      fn: verifyApiKey,
    };

    const serverNext = vi.fn((next: void) => Promise.resolve(next));
    const middlewareSpy = vi.spyOn(middleware, "fn");

    await middleware.fn(req, res, serverNext);

    expect(middlewareSpy).toBeCalled();
    expect(req.isSystemWideAdmin).toBe(false);
    expect(req.isOrganizationOwnerOrAdmin).toBe(true);
    expect(serverNext).toHaveBeenCalled();
  });

  it("should return 403 if user is locked or blocked", async () => {
    const { req, res } = createMocks<CustomNextApiRequest, CustomNextApiResponse>({
      method: "POST",
      body: {},
      query: {
        apiKey: "cal_test_key",
      },
    });

    vi.mocked(prisma.apiKey.findUnique).mockResolvedValue({
      id: "key-3",
      userId: 3,
      expiresAt: null,
      lastUsedAt: null,
      user: {
        id: 3,
        uuid: "test-uuid-3",
        email: "locked@example.com",
        username: "locked",
        name: "Locked User",
        role: UserPermissionRole.USER,
        locked: true,
      },
    } as any);

    vi.mocked(prisma.apiKey.update).mockResolvedValue({} as any);

    vi.mocked(isAdminGuard).mockResolvedValue({
      isAdmin: false,
      scope: ScopeOfAdmin.SystemWide,
    });

    vi.mocked(isLockedOrBlocked).mockResolvedValue(true);

    const middleware = {
      fn: verifyApiKey,
    };

    const serverNext = vi.fn((next: void) => Promise.resolve(next));
    const middlewareSpy = vi.spyOn(middleware, "fn");

    await middleware.fn(req, res, serverNext);

    expect(middlewareSpy).toBeCalled();
    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res._getData())).toEqual({ error: "You are not authorized to perform this request." });
    expect(serverNext).not.toHaveBeenCalled();
  });
});
