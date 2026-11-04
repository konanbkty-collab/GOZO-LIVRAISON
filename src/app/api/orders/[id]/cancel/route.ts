import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { orders } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { updateOrderStatus } from "@/lib/orders";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Annulation d'une commande (client propriétaire ou admin). */
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const orderId = parseInt(id, 10);
  if (!isFinite(orderId)) return NextResponse.json({ error: "ID invalide" }, { status: 400 });

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const rows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!rows.length) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  const order = rows[0];

  const isOwner = session.role === "client" && order.clientId === session.userId;
  const isAdmin = session.role === "admin";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Vous ne pouvez annuler que vos propres courses" }, { status: 403 });
  }
  if (order.status === "delivered") {
    return NextResponse.json({ error: "Course déjà livrée" }, { status: 400 });
  }
  if (order.status === "cancelled") {
    return NextResponse.json({ error: "Course déjà annulée" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  await updateOrderStatus(orderId, "cancelled", { actorRole: session.role, actorName: session.name });

  return NextResponse.json({ ok: true });
}
