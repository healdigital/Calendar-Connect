import { readFileSync } from "node:fs";
import path from "node:path";
import { ExecutionContext, INestApplication } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { getDMMF } from "@prisma/internals";
import { createPrismock } from "prismock/build/main/lib/client";
import request from "supertest";
import { randomString } from "../../../test/utils/randomString";
import { BookingsModule } from "./bookings.module";
import appConfig from "@/config/app";
import { ApiAuthGuard } from "@/modules/auth/guards/api-auth/api-auth.guard";
import { PrismaModule } from "@/modules/prisma/prisma.module";
import { PrismaReadService } from "@/modules/prisma/prisma-read.service";
import { PrismaWriteService } from "@/modules/prisma/prisma-write.service";

let prismockInstance: any;

async function getPrismock() {
  const schemaPath = path.resolve(__dirname, "../../../../../../packages/prisma/schema.prisma");
  const schemaContent = readFileSync(schemaPath, "utf-8");
  const dmmf = await getDMMF({ datamodel: schemaContent });
  const PrismockClient = createPrismock({ dmmf } as any);
  return new PrismockClient();
}

describe("BookingsController (e2e)", () => {
  let app: INestApplication;
  const userEmail = `booking-e2e-${randomString()}@example.com`;
  let studentUser: any;
  let studentProfile: any;

  beforeAll(async () => {
    prismockInstance = await getPrismock();

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [appConfig],
        }),
        BookingsModule,
        PrismaModule,
      ],
    })
      .overrideProvider(PrismaWriteService)
      .useValue({
        prisma: prismockInstance,
        onModuleInit: async () => {},
        onModuleDestroy: async () => {},
      })
      .overrideProvider(PrismaReadService)
      .useValue({
        prisma: prismockInstance,
        onModuleInit: async () => {},
        onModuleDestroy: async () => {},
      })
      .overrideGuard(ApiAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = studentUser;
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    studentUser = await prismockInstance.user.create({
      data: { email: userEmail, username: userEmail },
    });

    studentProfile = await prismockInstance.studentProfile.create({
      data: {
        userId: studentUser.id,
        university: "E2E Uni",
        degree: "E2E Degree",
        field: "ENGINEERING" as any,
        year: 1,
        bio: "E2E Bio",
        isActive: true,
        status: "VERIFIED",
      },
    });
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  describe("V2 Booking Flow", () => {
    let bookingId: number;

    it("POST /v2/bookings - should create a booking", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const response = await request(app.getHttpServer())
        .post("/v2/bookings")
        .set("x-cal-api-version", "2024-08-13")
        .send({
          studentProfileId: studentProfile.id,
          dateTime: tomorrow.toISOString(),
          name: "Prospective Student",
          email: "prosp@example.com",
          question: "Test question",
        })
        .expect(201);

      expect(response.body.status).toBe("success");
      expect(response.body.data.bookingId).toBeDefined();
      bookingId = response.body.data.bookingId;
    });

    it("PATCH /v2/bookings/:id/reschedule - should reschedule", async () => {
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      dayAfterTomorrow.setHours(10, 0, 0, 0);

      const response = await request(app.getHttpServer())
        .patch(`/v2/bookings/${bookingId}/reschedule`)
        .set("x-cal-api-version", "2024-08-13")
        .send({
          newDateTime: dayAfterTomorrow.toISOString(),
        })
        .expect(200);

      expect(response.body.status).toBe("success");
    });
  });

  describe("POST /bookings/:id/rating", () => {
    it("should allow rating a booking", async () => {
      const b = await prismockInstance.booking.create({
        data: {
          userId: studentUser.id,
          startTime: new Date(),
          endTime: new Date(),
          title: "Test Session",
          status: "ACCEPTED",
          metadata: { isThotisSession: true, studentProfileId: studentProfile.id },
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/v2/bookings/${b.id}/rating`)
        .send({
          rating: 5,
          feedback: "Great session! Highly recommend.",
          studentId: studentProfile.id,
        })
        .expect(201);

      expect(response.body.status).toBe("success");
    });
  });
});
