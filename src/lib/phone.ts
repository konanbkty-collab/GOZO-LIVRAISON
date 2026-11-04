/** Normalisation des numéros ivoiriens au format +225XXXXXXXXXX */

export function normalizePhone(input: string): string {
  let digits = input.replace(/[^\d+]/g, "").replace(/^\+/, "");
  if (digits.startsWith("00")) digits = digits.slice(2);

  if (!digits.startsWith("225")) {
    if (digits.startsWith("0") && digits.length === 10) {
      // 07 57 31 52 68 -> +225 07 57 31 52 68 (le 0 est conservé)
      digits = "225" + digits;
    } else if (/^[1257]\d{8}$/.test(digits)) {
      // 7 57 31 52 68 -> +225 07 57 31 52 68
      digits = "2250" + digits;
    } else {
      digits = "225" + digits;
    }
  }
  return "+" + digits;
}

export function isValidIvorianPhone(input: string): boolean {
  const normalized = normalizePhone(input);
  return /^\+225(01|05|07|25|27)\d{8}$/.test(normalized);
}

/**
 * Numéros autorisés à administrer GOZO.
 * Variable d'environnement GOZO_ADMIN_PHONES (plusieurs numéros séparés par
 * des virgules). À défaut : numéro de démonstration 07 07 07 07 07.
 */
export function getAdminPhones(): string[] {
  const raw = process.env.GOZO_ADMIN_PHONES ?? process.env.GOZO_ADMIN_PHONE ?? "0707070707";
  return raw
    .split(/[,;]+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(normalizePhone);
}

export function isAdminPhone(phone: string): boolean {
  return getAdminPhones().includes(normalizePhone(phone));
}

/** Découpe un numéro pour l'affichage : +225 07 57 31 52 68 */
export function prettyPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("225")) {
    const rest = digits.slice(3);
    return `+225 ${rest.slice(0, 2)} ${rest.slice(2, 4)} ${rest.slice(4, 6)} ${rest.slice(6, 8)} ${rest.slice(8, 10)}`.trim();
  }
  return phone;
}
