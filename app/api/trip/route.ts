import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { message: "Open a specific trip using /trip/[groupId]." },
    { status: 200 }
  );
}
