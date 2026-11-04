import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { and, eq } from "drizzle-orm";
import { orders } from "@/db/schema";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Note du client après livraison (1 à 5 étoiles). */
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const orderId = parseInt(id, 10);
  if (!isFinite(orderId)) return NextResponse.json({ error: "ID invalide" }, { status: 400 });

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const rows = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.clientId, session.userId)))
    .limit(1);
  if (!rows.length) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  const order = rows[0];
  if (order.status !== "delivered") {
    return NextResponse.json({ error: "La course doit être livrée pour être notée" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const rating = Math.min(5, Math.max(1, parseInt(String(body.rating ?? "5"), 10) || 5));

  await db.update(orders).set({ rating }).where(eq(orders.id, orderId));
  return NextResponse.json({ ok: true, rating });
}
