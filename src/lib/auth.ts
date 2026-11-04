import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { eq, and, gt } from "drizzle-orm";
import { db } from "@/db";
import { otpCodes, sessions, users, drivers } from "@/db/schema";

export const SESSION_COOKIE = "gozo_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours

export type SessionInfo = {
  token: string;
  userId: number;
  role: string;
  driverId: number | null;
  phone: string;
  name: string;
};

/** Crée une session persistante (cookie httpOnly) pour un utilisateur. */
export async function createSession(
  userId: number,
  role: string,
  driverId: number | null,
): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await db.insert(sessions).values({
    token,
    userId,
    role,
    driverId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
  return token;
}

/** Récupère la session courante (ou null). */
export async function getSession(): Promise<SessionInfo | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const rows = await db
    .select({
      token: sessions.token,
      userId: sessions.userId,
      role: sessions.role,
      driverId: sessions.driverId,
      expiresAt: sessions.expiresAt,
      phone: users.phone,
      name: users.name,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (!rows.length) return null;
  const s = rows[0];
  return {
    token: s.token,
    userId: s.userId,
    role: s.role,
    driverId: s.driverId,
    phone: s.phone,
    name: s.name,
  };
}

/** Supprime la session courante (déconnexion). */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.token, token));
  }
  store.delete(SESSION_COOKIE);
}

/** Trouve (ou crée) l'utilisateur pour un téléphone + rôle donnés. */
export async function upsertUser(phone: string, role: string, name?: string) {
  const existing = await db.select().from(users).where(and(eq(users.phone, phone), eq(users.role, role))).limit(1);
  if (existing.length) {
    if (name && name !== existing[0].name) {
      await db.update(users).set({ name }).where(eq(users.id, existing[0].id));
      return { ...existing[0], name };
    }
    return existing[0];
  }
  const created = await db
    .insert(users)
    .values({ phone, role, name: name ?? "" })
    .returning();
  return created[0];
}

/** Génère et enregistre un code OTP à 6 chiffres (valable 10 minutes). */
export async function createOtp(phone: string, role: string): Promise<string> {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  await db.insert(otpCodes).values({
    phone,
    code,
    role,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });
  return code;
}

/** Vérifie un code OTP et le marque comme consommé. */
export async function verifyOtp(phone: string, role: string, code: string): Promise<boolean> {
  const rows = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.phone, phone),
        eq(otpCodes.role, role),
        eq(otpCodes.consumed, false),
        gt(otpCodes.expiresAt, new Date()),
      ),
    )
    .orderBy(otpCodes.id)
    .limit(20);

  const match = rows.find((r) => r.code === code.trim());
  if (!match) return false;
  await db.update(otpCodes).set({ consumed: true }).where(eq(otpCodes.id, match.id));
  return true;
}

/** Retourne le profil livreur associé à un téléphone, s'il existe. */
export async function findDriverByPhone(phone: string) {
  const rows = await db.select().from(drivers).where(eq(drivers.phone, phone)).limit(1);
  return rows[0] ?? null;
}
