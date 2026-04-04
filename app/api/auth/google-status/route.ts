import { NextResponse } from "next/server";
import { isGoogleAuthConfigured } from "@/lib/auth";

export async function GET() {
  return NextResponse.json({
    enabled: isGoogleAuthConfigured,
    message: isGoogleAuthConfigured
      ? "Google sign-in is ready."
      : "Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local to enable Google sign-in.",
  });
}
