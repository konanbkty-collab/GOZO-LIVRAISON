import { NextRequest, NextResponse } from "next/server";
import { createSession, upsertUser, verifyOtp, findDriverByPhone } from "@/lib/auth";
import { normalizePhone, isAdminPhone } from "@/lib/phone";

export const dynamic = "force-dynamic";

/** Vérifie le code OTP et ouvre une session. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = normalizePhone(String(body.phone ?? ""));
    const code = String(body.code ?? "").trim();
    const role = body.role === "driver" ? "driver" : body.role === "admin" ? "admin" : "client";
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : undefined;
    if (role === "admin" && !isAdminPhone(phone)) {
      return NextResponse.json({ error: "Numéro non autorisé pour l'administration GOZO" }, { status: 403 });
    }

    if (!code) return NextResponse.json({ error: "Code requis" }, { status: 400 });

    const valid = await verifyOtp(phone, role, code);
    if (!valid) {
      return NextResponse.json({ error: "Code incorrect ou expiré" }, { status: 401 });
    }

    // Un livreur doit exister dans la flotte (créé par l'admin)
    let driverId: number | null = null;
    if (role === "driver") {
      const driver = await findDriverByPhone(phone);
      if (!driver) {
        return NextResponse.json(
          { error: "Ce numéro n'est pas enregistré comme livreur GOZO. Contactez l'administrateur." },
          { status: 403 },
        );
      }
      driverId = driver.id;
    }

    const user = await upsertUser(phone, role, name);
    await createSession(user.id, role, driverId);

    return NextResponse.json({ ok: true, user: { id: user.id, phone: user.phone, name: user.name, role: user.role }, driverId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur" }, { status: 500 });
  }
}
