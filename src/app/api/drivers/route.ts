import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { drivers } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";
import { GAGNOA } from "@/lib/geo";

export const dynamic = "force-dynamic";

/** Liste de la flotte de livreurs (admin). */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Réservé à l'administrateur" }, { status: 403 });
  }
  const rows = await db.select().from(drivers);
  return NextResponse.json({ drivers: rows });
}

/** Création d'un livreur (admin). */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Réservé à l'administrateur" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const phone = normalizePhone(String(body.phone ?? ""));
    if (!name || !phone) return NextResponse.json({ error: "Nom et téléphone requis" }, { status: 400 });

    const existing = await db.select().from(drivers).where(eqPhoneSafe(phone)).limit(1);
    if (existing.length) return NextResponse.json({ error: "Ce numéro est déjà enregistré" }, { status: 409 });

    const lat = typeof body.lat === "number" ? body.lat : GAGNOA.lat;
    const lng = typeof body.lng === "number" ? body.lng : GAGNOA.lng;

    const created = await db
      .insert(drivers)
      .values({
        name,
        phone,
        vehicle: String(body.vehicle ?? "Moto"),
        plate: String(body.plate ?? ""),
        status: "inactive",
        lat,
        lng,
      })
      .returning();

    return NextResponse.json({ ok: true, driver: created[0] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur" }, { status: 500 });
  }
}

function eqPhoneSafe(phone: string) {
  return eq(drivers.phone, phone);
}
