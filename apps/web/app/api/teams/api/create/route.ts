import { HttpError } from "@calcom/lib/http-error";
import { defaultResponderForAppDir } from "app/api/defaultResponderForAppDir";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Stubbed handler for team creation callback
async function handler(request: NextRequest) {
  // Logic removed due to removal of @calcom/ee and Stripe dependencies
  return NextResponse.json({ message: "Billing and Stripe integration disabled." });
}

export const GET = defaultResponderForAppDir(handler);
