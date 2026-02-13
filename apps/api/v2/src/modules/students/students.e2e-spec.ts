import { readFileSync } from "node:fs";
import path from "node:path";
import { INestApplication } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthGuard } from "@nestjs/passport";
import { Test, TestingModule } from "@nestjs/testing";
import { getDMMF } from "@prisma/internals";
import { createPrismock } from "prismock/build/main/lib/client";
import request from "supertest";
import { randomString } from "../../../test/utils/randomString";
import { StudentsModule } from "./students.module";
import appConfig from "@/config/app";
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

describe("StudentsController (e2e)", () => {
  let app: INestApplication;
  const userEmail = `student-e2e-${randomString()}@example.com`;
  let user: any;

  beforeAll(async () => {
    prismockInstance = await getPrismock();

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [appConfig],
        }),
        StudentsModule,
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
      .overrideGuard(AuthGuard("jwt"))
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    user = await prismockInstance.user.create({
      data: {
        email: userEmail,
        username: userEmail,
        name: "E2E Student",
      },
    });
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  describe("GET /students/:id", () => {
    it("should return 404 for non-existent profile", async () => {
      return request(app.getHttpServer()).get(`/v2/students/${user.id}`).expect(404);
    });

    it("should return student profile if exists", async () => {
      await prismockInstance.studentProfile.create({
        data: {
          userId: user.id,
          university: "E2E University",
          degree: "E2E Degree",
          field: "ENGINEERING" as any,
          year: 1,
          bio: "E2E Bio",
          isActive: true,
          status: "VERIFIED",
        },
      });

      const response = await request(app.getHttpServer()).get(`/v2/students/${user.id}`).expect(200);

      expect(response.body.status).toBe("success");
      expect(response.body.data.userId).toBe(user.id);
    });
  });

  describe("GET /students/by-field/:field", () => {
    it("should return students by field", async () => {
      const response = await request(app.getHttpServer())
        .get("/v2/students/by-field/ENGINEERING")
        .expect(200);

      expect(response.body.status).toBe("success");
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });
});
