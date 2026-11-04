import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { drivers } from "@/db/schema";

export const dynamic = "force-dynamic";

/** Session courante + profil livreur éventuel. */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ session: null });

  let driver = null;
  if (session.role === "driver" && session.driverId) {
    const rows = await db.select().from(drivers).where(eq(drivers.id, session.driverId)).limit(1);
    driver = rows[0] ?? null;
  }

  return NextResponse.json({
    session: { userId: session.userId, phone: session.phone, name: session.name, role: session.role },
    driver,
  });
}
