import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const TRUSTEE_COOKIE = "bsah-trustee";
export const SESSION_SECONDS = 60 * 60;
type Invitation = { id: string; institution: string; codeHash: string; expiresAt: string };

// Codes stay out of client bundles and logs. Only SHA-256 hashes are provisioned.
export function trusteeConfig(): { secret: string; invitations: Invitation[] } | null {
  const secret = process.env.TRUSTEE_SESSION_SECRET;
  if (!secret || secret.length < 32) return null;
  try {
    const data: unknown = JSON.parse(process.env.TRUSTEE_INVITATIONS_JSON || "[]");
    if (!Array.isArray(data) || !data.length || data.length > 1000) return null;
    const invitations = data.filter((item): item is Invitation => item && typeof item.id === "string" && typeof item.institution === "string" && /^[a-f0-9]{64}$/.test(item.codeHash) && Number.isFinite(Date.parse(item.expiresAt)));
    if (invitations.length !== data.length || new Set(invitations.map((i) => i.id)).size !== invitations.length) return null;
    return { secret, invitations };
  } catch { return null; }
}

function equal(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function matchInvitation(code: string) {
  const config = trusteeConfig();
  if (!config) return null;
  const hash = createHash("sha256").update(code.trim()).digest("hex");
  return config.invitations.find((invite) => equal(hash, invite.codeHash) && Date.parse(invite.expiresAt) > Date.now()) ?? null;
}

export function createTrusteeSession(invite: Invitation) {
  const config = trusteeConfig();
  if (!config) throw new Error("Trustee access is unavailable");
  const exp = Math.min(Date.now() + SESSION_SECONDS * 1000, Date.parse(invite.expiresAt));
  const payload = Buffer.from(JSON.stringify({ id: invite.id, exp, nonce: randomBytes(16).toString("hex") })).toString("base64url");
  return `${payload}.${createHmac("sha256", config.secret).update(payload).digest("base64url")}`;
}

export function readTrusteeSession(token?: string) {
  const config = trusteeConfig();
  if (!config || !token || token.length > 2048) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  if (!equal(signature, createHmac("sha256", config.secret).update(payload).digest("base64url"))) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof session.exp !== "number" || session.exp <= Date.now()) return null;
    return config.invitations.find((invite) => invite.id === session.id && Date.parse(invite.expiresAt) > Date.now()) ?? null;
  } catch { return null; }
}
