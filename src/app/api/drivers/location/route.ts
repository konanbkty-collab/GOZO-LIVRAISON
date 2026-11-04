import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { drivers } from "@/db/schema";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Mise à jour de la position GPS du livreur (suivi temps réel). */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "driver") {
    return NextResponse.json({ error: "Réservé aux livreurs" }, { status: 403 });
  }

  const body = await request.json();
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  const heading = Number(body.heading ?? 0);

  if (!isFinite(lat) || !isFinite(lng)) {
    return NextResponse.json({ error: "Coordonnées invalides" }, { status: 400 });
  }
  if (!session.driverId) return NextResponse.json({ error: "Profil livreur manquant" }, { status: 400 });

  await db
    .update(drivers)
    .set({ lat, lng, heading, lastLocationAt: new Date(), updatedAt: new Date() })
    .where(eq(drivers.id, session.driverId));

  return NextResponse.json({ ok: true });
}
