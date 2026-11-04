import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { drivers } from "@/db/schema";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Le livreur se met en ligne / hors ligne. */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "driver") {
    return NextResponse.json({ error: "Réservé aux livreurs" }, { status: 403 });
  }

  const body = await request.json();
  const status = String(body.status ?? "online");
  if (!["online", "inactive"].includes(status)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  // Un livreur en course ne peut pas se déconnecter
  if (session.driverId) {
    const rows = await db.select().from(drivers).where(eq(drivers.id, session.driverId)).limit(1);
    if (!rows.length) return NextResponse.json({ error: "Livreur introuvable" }, { status: 404 });
    if (status === "inactive" && rows[0].status === "busy") {
      return NextResponse.json({ error: "Terminez votre course avant de vous déconnecter" }, { status: 400 });
    }
    await db
      .update(drivers)
      .set({ status: status === "online" && rows[0].status === "busy" ? "busy" : status, updatedAt: new Date() })
      .where(eq(drivers.id, session.driverId));
  }

  return NextResponse.json({ ok: true });
}
