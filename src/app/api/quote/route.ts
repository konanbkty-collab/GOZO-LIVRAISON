import { NextRequest, NextResponse } from "next/server";
import { getPricingConfig } from "@/lib/orders";
import { computeQuote } from "@/lib/pricing";
import { estimateDurationMin, roadDistanceKm } from "@/lib/geo";

export const dynamic = "force-dynamic";

/** Calcul du tarif entre deux points GPS. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pickupLat, pickupLng, dropoffLat, dropoffLng, rain } = body;

    for (const v of [pickupLat, pickupLng, dropoffLat, dropoffLng]) {
      if (typeof v !== "number" || !isFinite(v)) {
        return NextResponse.json({ error: "Coordonnées GPS invalides" }, { status: 400 });
      }
    }

    const cfg = await getPricingConfig();
    const quote = computeQuote(
      { pickupLat, pickupLng, dropoffLat, dropoffLng, rain: !!rain },
      cfg,
    );

    return NextResponse.json({
      ok: true,
      quote,
      config: {
        baseFare: cfg.baseFare,
        baseKm: cfg.baseKm,
        perKm: cfg.perKm,
        minimumFare: cfg.minimumFare,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur" }, { status: 500 });
  }
}
