import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { quartiers } from "@/db/schema";

export const dynamic = "force-dynamic";

/** Recherche des quartiers & lieux de Gagnoa (géolocalisation). */
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();
  const all = await db.select().from(quartiers);
  const results = q
    ? all.filter((p) => p.name.toLowerCase().includes(q)).sort((a, b) => a.name.length - b.name.length)
    : all.slice(0, 8);
  return NextResponse.json({ places: results.slice(0, 10) });
}
