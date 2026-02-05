import process from "node:process";
import { execSync } from "child_process";
import path from "path";

// Configuration
const API_URL = "http://localhost:5555/api/v2";
const DURATION = 10; // seconds
const CONNECTIONS = 100;

function runSetup() {
  console.log("Running setup script to generate test data and token...");
  try {
    const setupScriptPath = path.join(__dirname, "setup_load_test.ts");
    const cmd = `DATABASE_URL="postgresql://leoturbetdelof@localhost:5432/calendso" npx ts-node "${setupScriptPath}"`;
    const output = execSync(cmd, { encoding: "utf-8" });

    // Extract JSON result
    const startMarker = "--- RESULT ---";
    const endMarker = "--- END RESULT ---";
    const startIndex = output.indexOf(startMarker);
    const endIndex = output.indexOf(endMarker);

    if (startIndex === -1 || endIndex === -1) {
      console.error("Setup script did not output expected result format.");
      console.log("Output:", output);
      process.exit(1);
    }

    const jsonStr = output.substring(startIndex + startMarker.length, endIndex).trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Failed to run setup script:", error);
    process.exit(1);
  }
}

function runLoadTest(name: string, url: string, token: string) {
  console.log(`\n\n=== Running Load Test: ${name} ===`);
  console.log(`URL: ${url}`);
  const cmd = `npx autocannon -c ${CONNECTIONS} -d ${DURATION} -H "Authorization: Bearer ${token}" "${url}"`;
  try {
    execSync(cmd, { stdio: "inherit" });
  } catch (e) {
    console.error(`Load test ${name} failed execution.`);
  }
}

async function main() {
  const data = runSetup();
  const { token, profileId } = data;

  if (!token || !profileId) {
    console.error("Missing token or profileId from setup data.");
    process.exit(1);
  }

  console.log("Setup complete. Token and Profile ID retrieved.");

  // 1. Browse Profiles (High volume read)
  runLoadTest("Browse Profiles (Computer Science)", `${API_URL}/students/by-field/COMPUTER_SCIENCE`, token);

  // 2. View Availability (Complex read with caching)
  const start = new Date().toISOString();
  const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
  // Note: URL encoding might be needed for dates? Usually ISO string is fine in query params if client handles it,
  // but autocannon takes raw string.
  runLoadTest(
    "View Availability (30 Days)",
    `${API_URL}/students/${profileId}/availability?start=${start}&end=${end}`,
    token
  );

  console.log("\nLoad tests completed.");
}

main().catch(console.error);
