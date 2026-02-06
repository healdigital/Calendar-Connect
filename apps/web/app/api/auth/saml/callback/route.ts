import { defaultResponderForAppDir } from "app/api/defaultResponderForAppDir";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

async function handler(req: NextRequest) {
  return NextResponse.json(
    { message: "SAML SSO is not available in the open-source version." },
    { status: 404 }
  );
}

export const POST = defaultResponderForAppDir(handler);
