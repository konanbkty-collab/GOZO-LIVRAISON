import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { orders } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { refuseOrder, updateOrderStatus } from "@/lib/orders";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Acceptation ou refus d'une course par le livreur assigné. */
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const orderId = parseInt(id, 10);
  if (!isFinite(orderId)) return NextResponse.json({ error: "ID invalide" }, { status: 400 });

  const session = await getSession();
  if (!session || session.role !== "driver") {
    return NextResponse.json({ error: "Réservé aux livreurs" }, { status: 403 });
  }

  const rows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!rows.length) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  const order = rows[0];

  if (order.driverId !== session.driverId) {
    return NextResponse.json({ error: "Cette course ne vous est pas attribuée" }, { status: 403 });
  }
  if (order.status !== "assigned") {
    return NextResponse.json({ error: "Cette course a déjà été traitée" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const accept = body.accept !== false;

  if (accept) {
    await updateOrderStatus(orderId, "accepted", { actorRole: "driver", actorName: session.name });
    return NextResponse.json({ ok: true, action: "accepted" });
  }

  const nextDriverId = await refuseOrder(orderId, session.driverId!);
  return NextResponse.json({ ok: true, action: "refused", reassignedTo: nextDriverId });
}
