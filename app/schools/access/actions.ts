"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createTrusteeSession, matchInvitation, SESSION_SECONDS, TRUSTEE_COOKIE, trusteeConfig } from "@/lib/security/trustee";
import { consumeRateLimit } from "@/lib/security/rate-limit";

export type AccessState = { error: string } | null;

export async function unlockInstitution(_state: AccessState, data: FormData): Promise<AccessState> {
  // A fixed delay makes code enumeration expensive without storing personal data.
  // Use high-entropy issued codes; production edge rate limits remain recommended.
  await new Promise((resolve) => setTimeout(resolve, 650));
  if (!trusteeConfig()) return { error: "Institutional access is not yet open. Contact the academy to activate your invitation." };
  // Per-client attempt limit (salted hash of the forwarded address; nothing stored in clear).
  const h = await headers();
  const client = (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "unknown").trim().slice(0, 64);
  if (!(await consumeRateLimit("trustee", client)).allowed) return { error: "Too many attempts. Please wait fifteen minutes or contact the academy." };
  const code = data.get("passcode");
  if (typeof code !== "string" || code.length < 16 || code.length > 128) return { error: "This invitation could not be verified. Check the code or contact the academy." };
  const invite = matchInvitation(code);
  if (!invite) return { error: "This invitation could not be verified. Check the code or contact the academy." };
  (await cookies()).set(TRUSTEE_COOKIE, createTrusteeSession(invite), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/schools/access", maxAge: SESSION_SECONDS });
  redirect("/schools/access");
}

export async function lockInstitution() {
  (await cookies()).set(TRUSTEE_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/schools/access", maxAge: 0 });
  redirect("/schools/access");
}
