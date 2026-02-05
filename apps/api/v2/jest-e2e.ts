import type { Config } from "jest";

const path = require("node:path");

// Detect if sharding is being used by checking for --shard flag
const isSharding = process.argv.some((arg) => arg.includes("--shard"));

// For Jest e2e, we reduce parallelism when sharding in CI to improve test isolation
// since tests share database state and can interfere with each other
const getMaxWorkers = () => {
  if (process.env.CI && isSharding) {
    // In CI with sharding: reduce workers to improve test isolation
    // Sharding already provides parallelism across shards (4 parallel jobs)
    return 4;
  }
  // Local development or non-sharded: use more workers (similar to Playwright)
  return 8;
};

const maxWorkers = getMaxWorkers();

const packagesDir = path.resolve(__dirname, "../../../packages");

const config: Config = {
  preset: "ts-jest",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  rootDir: ".",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^test/(.*)$": "<rootDir>/test/$1",
    "^@calcom/platform-libraries$": path.join(packagesDir, "platform/libraries/index"),
    "^@calcom/platform-libraries/(.*)$": path.join(packagesDir, "platform/libraries/$1"),
    "^@calcom/platform-constants$": path.join(packagesDir, "platform/constants/index"),
    "^@calcom/platform-types$": path.join(packagesDir, "platform/types/index"),
    "^@calcom/platform-utils$": path.join(packagesDir, "platform/utils/index"),
    "^@calcom/platform-enums$": path.join(packagesDir, "platform/enums/index"),
    "^@calcom/prisma/client$": path.join(packagesDir, "prisma/client/index"),
    "^@calcom/prisma$": path.join(packagesDir, "prisma/index"),
    "^@calcom/trpc/(.*)$": path.join(packagesDir, "trpc/$1"),
    "^@calcom/trpc$": path.join(packagesDir, "trpc/index"),
    "^@calcom/lib/(.*)$": path.join(packagesDir, "lib/$1"),
    "^@calcom/lib$": path.join(packagesDir, "lib/index"),
    "^@calcom/features/(.*)$": path.join(packagesDir, "features/$1"),
    "^@calcom/features$": path.join(packagesDir, "features/index"),
    "^@calcom/app-store/(.*)$": path.join(packagesDir, "app-store/$1"),
    "^@calcom/app-store$": path.join(packagesDir, "app-store/index"),
    "^@calcom/emails/(.*)$": path.join(packagesDir, "emails/$1"),
    "^@calcom/emails$": path.join(packagesDir, "emails/index"),
    "^@calcom/sms/(.*)$": path.join(packagesDir, "sms/$1"),
    "^@calcom/sms$": path.join(packagesDir, "sms/index"),
    "^@calcom/ui/(.*)$": path.join(packagesDir, "ui/$1"),
    "^@calcom/ui$": path.join(packagesDir, "ui/index"),
    "^@calcom/types/(.*)$": path.join(packagesDir, "types/$1"),
    "^@calcom/types$": path.join(packagesDir, "types/index"),
    "^@calcom/ee/(.*)$": path.join(packagesDir, "features/ee/$1"),
    "^@calcom/ee$": path.join(packagesDir, "features/ee/index"),
  },
  roots: ["<rootDir>", packagesDir],
  testEnvironment: "node",
  testRegex: ".e2e-spec.ts$",
  transform: {
    "^.+\\.(t|j)sx?$": [
      "ts-jest",
      {
        isolatedModules: true,
        diagnostics: false,
      },
    ],
  },
  setupFiles: ["<rootDir>/test/setEnvVars.ts", "jest-date-mock"],
  setupFilesAfterEnv: ["<rootDir>/test/jest.setup-e2e.ts"],
  reporters: [
    "default",
    "jest-summarizing-reporter",
    [
      "jest-junit",
      {
        outputDirectory: "./test-results",
        outputName: "junit.xml",
      },
    ],
  ],
  workerIdleMemoryLimit: "512MB",
  maxWorkers,
  testPathIgnorePatterns: ["/dist/", "/node_modules/"],
  transformIgnorePatterns: ["/node_modules/(?!(@calcom)/)"],
};

export default config;
