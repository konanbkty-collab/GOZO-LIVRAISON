import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { orders, drivers } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { assignDriver, autoAssign } from "@/lib/orders";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Attribution manuelle (admin) d'une course à un livreur. */
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const orderId = parseInt(id, 10);
  if (!isFinite(orderId)) return NextResponse.json({ error: "ID invalide" }, { status: 400 });

  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Réservé à l'administrateur" }, { status: 403 });
  }

  const rows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!rows.length) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });

  const body = await request.json().catch(() => ({}));

  if (body.auto) {
    const driverId = await autoAssign(orderId);
    return NextResponse.json({ ok: true, driverId, auto: true });
  }

  const driverId = Number(body.driverId);
  if (!isFinite(driverId)) return NextResponse.json({ error: "driverId requis" }, { status: 400 });

  const drows = await db.select().from(drivers).where(eq(drivers.id, driverId)).limit(1);
  if (!drows.length) return NextResponse.json({ error: "Livreur introuvable" }, { status: 404 });

  await assignDriver(orderId, driverId);
  return NextResponse.json({ ok: true, driverId });
}
