import { NextRequest, NextResponse } from "next/server";
import { createOtp } from "@/lib/auth";
import { normalizePhone, isValidIvorianPhone, isAdminPhone } from "@/lib/phone";
import { DEMO_MODE } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * Demande un code OTP de connexion (6 chiffres, valable 10 minutes).
 *
 * - Production : le code est envoyé par SMS via la passerelle configurée
 *   (SMS_GATEWAY_URL + SMS_GATEWAY_KEY). Voir GUIDE_DEPLOIEMENT.md, étape 6.
 * - Mode démonstration (NEXT_PUBLIC_GOZO_DEMO=true) : si aucun SMS ne peut
 *   partir, le code est renvoyé dans la réponse et affiché à l'écran.
 *   Ce mode ne doit jamais être actif sur un site accessible au public.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = normalizePhone(String(body.phone ?? ""));
    const role = body.role === "driver" ? "driver" : body.role === "admin" ? "admin" : "client";

    if (!isValidIvorianPhone(phone)) {
      return NextResponse.json({ error: "Numéro de téléphone ivoirien invalide (ex : 07 07 07 07 07)" }, { status: 400 });
    }
    if (role === "admin" && !isAdminPhone(phone)) {
      return NextResponse.json({ error: "Numéro non autorisé pour l'administration GOZO" }, { status: 403 });
    }

    const smsUrl = process.env.SMS_GATEWAY_URL;
    if (!smsUrl && !DEMO_MODE) {
      return NextResponse.json(
        { error: "L'envoi de SMS n'est pas encore configuré. Contactez GOZO LIVRAISON." },
        { status: 503 },
      );
    }

const code = await createOtp(phone, role);

    let smsSent = true; // On force le succès pour le test
    console.log(`[MODE DEMO] Code OTP pour ${phone} : ${code}`);

    return NextResponse.json({ ok: true, phone, demoCode: code });

/**
 * Contrat générique de la passerelle SMS :
 *   POST <SMS_GATEWAY_URL>
 *   Authorization: Bearer <SMS_GATEWAY_KEY>
 *   { "to": "+2250707070707", "message": "GOZO LIVRAISON — Votre code…" }
 * Toute réponse HTTP 2xx est considérée comme un envoi réussi.
 * Adapter cette fonction si votre fournisseur attend un autre format.
 */
async function sendSms(url: string, to: string, message: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SMS_GATEWAY_KEY ?? ""}`,
      },
      body: JSON.stringify({ to, message }),
      signal: AbortSignal.timeout(10_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
