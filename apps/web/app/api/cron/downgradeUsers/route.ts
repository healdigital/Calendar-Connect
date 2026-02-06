import process from "node:process";
import { defaultResponderForAppDir } from "app/api/defaultResponderForAppDir";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

async function postHandler(request: NextRequest) {
  const apiKey = request.headers.get("authorization") || request.nextUrl.searchParams.get("apiKey");

  if (process.env.CRON_API_KEY !== apiKey) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  // Billing/downgrade feature is stubbed in open source version.
  return NextResponse.json({ ok: true, message: "Stubbed in open source" });
}

export const POST = defaultResponderForAppDir(postHandler);
