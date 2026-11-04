import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAdminStats } from "@/lib/orders";

export const dynamic = "force-dynamic";

/** Statistiques du tableau de bord administrateur. */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Réservé à l'administrateur" }, { status: 403 });
  }
  const stats = await getAdminStats();
  return NextResponse.json({ stats });
}
