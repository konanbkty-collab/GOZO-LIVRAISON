import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { pricingConfig } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { getPricingConfig } from "@/lib/orders";

export const dynamic = "force-dynamic";

/** Lecture de la grille tarifaire. */
export async function GET() {
  const cfg = await getPricingConfig();
  return NextResponse.json({ config: cfg });
}

/** Mise à jour de la grille tarifaire (admin). */
export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Réservé à l'administrateur" }, { status: 403 });
  }

  const cfg = await getPricingConfig();
  const body = await request.json();

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.baseFare === "number") patch.baseFare = Math.max(0, Math.round(body.baseFare));
  if (typeof body.baseKm === "number") patch.baseKm = Math.max(0.1, body.baseKm);
  if (typeof body.perKm === "number") patch.perKm = Math.max(0, Math.round(body.perKm));
  if (typeof body.nightSurcharge === "number") patch.nightSurcharge = Math.max(0, Math.round(body.nightSurcharge));
  if (typeof body.nightStartHour === "number") patch.nightStartHour = Math.min(23, Math.max(0, Math.round(body.nightStartHour)));
  if (typeof body.nightEndHour === "number") patch.nightEndHour = Math.min(23, Math.max(0, Math.round(body.nightEndHour)));
  if (typeof body.rainSurcharge === "number") patch.rainSurcharge = Math.max(0, Math.round(body.rainSurcharge));
  if (typeof body.commissionPercent === "number") patch.commissionPercent = Math.min(50, Math.max(0, body.commissionPercent));
  if (typeof body.minimumFare === "number") patch.minimumFare = Math.max(0, Math.round(body.minimumFare));

  await db.update(pricingConfig).set(patch).where(eq(pricingConfig.id, cfg.id));
  return NextResponse.json({ ok: true });
}
