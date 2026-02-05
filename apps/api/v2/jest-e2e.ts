import type { Config } from "jest";

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

const config: Config = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^test/(.*)$": "<rootDir>/test/$1",
    "^@calcom/platform-libraries$": "<rootDir>/../../../packages/platform/libraries/index",
    "^@calcom/platform-libraries/(.*)$": "<rootDir>/../../../packages/platform/libraries/$1",
    "^@calcom/platform-constants$": "<rootDir>/../../../packages/platform/constants/index",
    "^@calcom/platform-types$": "<rootDir>/../../../packages/platform/types/index",
    "^@calcom/platform-utils$": "<rootDir>/../../../packages/platform/utils/index",
    "^@calcom/platform-enums$": "<rootDir>/../../../packages/platform/enums/index",
    "^@calcom/prisma/client$": "<rootDir>/../../../packages/prisma/generated/prisma/client",
    "^@calcom/prisma$": "<rootDir>/../../../packages/prisma/index",
    "^@calcom/trpc$": "<rootDir>/../../../packages/trpc/index",
    "^@calcom/trpc/(.*)$": "<rootDir>/../../../packages/trpc/$1",
    "^@calcom/lib$": "<rootDir>/../../../packages/lib/index",
    "^@calcom/lib/(.*)$": "<rootDir>/../../../packages/lib/$1",
    "^@calcom/features$": "<rootDir>/../../../packages/features/index",
    "^@calcom/features/(.*)$": "<rootDir>/../../../packages/features/$1",
  },
  roots: ["<rootDir>", "<rootDir>/../../../packages"],
  testEnvironment: "node",
  testRegex: ".e2e-spec.ts$",
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      process.env.CI
        ? {
            isolatedModules: true,
            diagnostics: false,
          }
        : {},
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
