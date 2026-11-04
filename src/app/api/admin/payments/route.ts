import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Historique des paiements et commissions (admin). */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Réservé à l'administrateur" }, { status: 403 });
  }
  const rows = await db.select().from(payments).orderBy(desc(payments.createdAt)).limit(300);
  return NextResponse.json({ payments: rows });
}
