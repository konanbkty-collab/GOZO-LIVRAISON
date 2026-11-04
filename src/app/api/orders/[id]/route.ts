import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { and, asc, eq } from "drizzle-orm";
import { orderEvents, orders, drivers } from "@/db/schema";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Détail d'une commande + timeline + position live du livreur. */
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const orderId = parseInt(id, 10);
  if (!isFinite(orderId)) return NextResponse.json({ error: "ID invalide" }, { status: 400 });

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const rows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!rows.length) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  const order = rows[0];

  // Contrôle d'accès : client propriétaire, livreur assigné, ou admin
  const isOwner = session.role === "client" && order.clientId === session.userId;
  const isDriver = session.role === "driver" && order.driverId === session.driverId;
  const isAdmin = session.role === "admin";
  if (!isOwner && !isDriver && !isAdmin) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const events = await db
    .select()
    .from(orderEvents)
    .where(eq(orderEvents.orderId, orderId))
    .orderBy(asc(orderEvents.createdAt));

  let driver = null;
  if (order.driverId) {
    const drows = await db.select().from(drivers).where(eq(drivers.id, order.driverId)).limit(1);
    driver = drows[0] ?? null;
  }

  return NextResponse.json({ order, events, driver });
}
