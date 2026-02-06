import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Support conversation not available in Open Source edition" },
    { status: 404 }
  );
}
