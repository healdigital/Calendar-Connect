import { ProfileService, ThotisBookingService } from "@calcom/platform-libraries";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Test, TestingModule } from "@nestjs/testing";
import fc from "fast-check";
import request from "supertest";
import { StudentsController } from "./students.controller";

// Mock the library to avoid loading deep dependencies
jest.mock("@calcom/platform-libraries", () => ({
  ProfileService: class {},
  ThotisBookingService: class {},
}));

// Mock Services
const mockProfileService = {
  getProfilesByField: jest.fn(),
  getProfile: jest.fn(),
  createProfile: jest.fn(),
  updateProfile: jest.fn(),
  activateProfile: jest.fn(),
  deactivateProfile: jest.fn(),
};

const mockThotisBookingService = {
  getStudentAvailability: jest.fn(),
};

// Mock AuthGuard
const mockAuthGuard = {
  canActivate: jest.fn((context) => {
    return true; // Default allow
  }),
};

describe("StudentsController Property Tests", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [StudentsController],
      providers: [
        { provide: ProfileService, useValue: mockProfileService },
        { provide: ThotisBookingService, useValue: mockThotisBookingService },
      ],
    })
      .overrideGuard(AuthGuard("jwt"))
      .useValue(mockAuthGuard)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  /**
   * Property 24: API Response Format Consistency
   * Validates: Requirements 8.1, 8.2, 8.3, 8.4
   */
  it("Property 24: All responses should follow { status, data } format", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc
          .string({ minLength: 1 })
          .filter((s) => /^[a-zA-Z0-9]+$/.test(s)), // field - avoid path chars
        async (field) => {
          // Mock successful response
          mockProfileService.getProfilesByField.mockResolvedValue([]);
          // Ensure Auth passes
          mockAuthGuard.canActivate.mockReturnValue(true);

          const response = await request(app.getHttpServer()).get(`/students/by-field/${field}`).expect(200);

          expect(response.body).toHaveProperty("status");
          expect(response.body).toHaveProperty("data");
          expect(response.body.status).toBe("success");
        }
      )
    );
  });

  /**
   * Property 37: HTTP Status Code Correctness
   * Validates: Requirements 16.3
   */
  it("Property 37: Should return 400 for invalid ID format", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generator for strings that cause parseInt to return NaN
        // Must not be empty, must be alphanumeric (avoid slashes/special chars that break URL routing)
        fc
          .string({ minLength: 1 })
          .filter((s) => /^[a-zA-Z0-9]+$/.test(s) && isNaN(parseInt(s))),
        async (invalidId) => {
          mockAuthGuard.canActivate.mockReturnValue(true);
          await request(app.getHttpServer()).get(`/students/${invalidId}`).expect(400); // Expect Bad Request
        }
      )
    );
  });

  it("Property 37: Should return 404 when profile not found", async () => {
    mockProfileService.getProfile.mockResolvedValue(null);
    mockAuthGuard.canActivate.mockReturnValue(true);

    await request(app.getHttpServer()).get("/students/123").expect(404);
  });

  /**
   * Property 23: API Authentication Enforcement
   * Validates: Requirements 8.5
   */
  it("Property 23: Protected endpoints should reject unauthenticated requests", async () => {
    // Temporarily mock guard to return false (simulate unauthenticated)
    mockAuthGuard.canActivate.mockReturnValueOnce(false);

    await request(app.getHttpServer()).post("/students/123/profile").send({}).expect(403);
  });

  // Test POST profile creation success
  it("Should create profile successfully", async () => {
    mockProfileService.createProfile.mockResolvedValue({ id: 1 });
    mockAuthGuard.canActivate.mockReturnValue(true);

    await request(app.getHttpServer())
      .post("/students/123/profile")
      .send({ bio: "test" })
      .expect(201)
      .expect((res) => {
        expect(res.body.status).toBe("success");
        expect(res.body.data).toBeDefined();
      });
  });

  // Test Availability endpoint
  it("Should return availability successfully", async () => {
    // Mock profile found
    mockProfileService.getProfile.mockResolvedValue({ id: "uuid-123" });
    mockThotisBookingService.getStudentAvailability.mockResolvedValue([]);
    mockAuthGuard.canActivate.mockReturnValue(true);

    await request(app.getHttpServer())
      .get("/students/123/availability?start=2023-01-01&end=2023-01-02")
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe("success");
        expect(res.body.data).toEqual([]);
        expect(mockProfileService.getProfile).toHaveBeenCalledWith(123);
        expect(mockThotisBookingService.getStudentAvailability).toHaveBeenCalledWith(
          "uuid-123",
          expect.anything()
        );
      });
  });
});
