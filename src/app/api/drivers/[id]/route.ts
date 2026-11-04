import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { drivers } from "@/db/schema";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Mise à jour d'un livreur : statut actif/inactif, position, infos (admin). */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const driverId = parseInt(id, 10);
  if (!isFinite(driverId)) return NextResponse.json({ error: "ID invalide" }, { status: 400 });

  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Réservé à l'administrateur" }, { status: 403 });
  }

  const rows = await db.select().from(drivers).where(eq(drivers.id, driverId)).limit(1);
  if (!rows.length) return NextResponse.json({ error: "Livreur introuvable" }, { status: 404 });

  const body = await request.json();
  const patch: Record<string, unknown> = { updatedAt: new Date() };

  if (typeof body.status === "string") {
    if (!["inactive", "online", "busy"].includes(body.status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }
    patch.status = body.status;
  }
  if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
  if (typeof body.phone === "string" && body.phone.trim()) patch.phone = body.phone.trim();
  if (typeof body.vehicle === "string") patch.vehicle = body.vehicle;
  if (typeof body.plate === "string") patch.plate = body.plate;
  if (typeof body.lat === "number" && isFinite(body.lat)) patch.lat = body.lat;
  if (typeof body.lng === "number" && isFinite(body.lng)) patch.lng = body.lng;

  await db.update(drivers).set(patch).where(eq(drivers.id, driverId));
  return NextResponse.json({ ok: true });
}
