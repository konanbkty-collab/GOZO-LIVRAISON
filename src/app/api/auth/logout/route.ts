import { NextResponse } from "next/server";
import { destroySession, getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  await destroySession();
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await getSession();
  return NextResponse.json({ session });
}
