/**
 * Phone sign-in input rules. Numbers are stored by Supabase in E.164 (+<country><number>). Indian numbers may be typed
 * the way people write them (98765 43210, 098765 43210, +91 98765 43210); any other country needs the leading "+".
 * Returns null for anything that is not a plausible mobile number, so nothing odd is ever sent to the SMS provider.
 */
export function normalizePhone(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const raw = input.trim();
  if (!raw || raw.length > 24 || /[^\d\s()+.-]/.test(raw)) return null;
  const digits = raw.replace(/\D/g, "");
  if (raw.startsWith("+") || raw.startsWith("00")) {
    const intl = raw.startsWith("+") ? digits : digits.slice(2);
    if (!/^[1-9]\d{7,14}$/.test(intl)) return null;
    if (intl.startsWith("91")) return /^91[6-9]\d{9}$/.test(intl) ? `+${intl}` : null;
    return `+${intl}`;
  }
  const national = digits.startsWith("0") ? digits.slice(1) : digits;
  if (/^[6-9]\d{9}$/.test(national)) return `+91${national}`;
  if (/^91[6-9]\d{9}$/.test(national)) return `+${national}`;
  return null;
}

/** The six digits of an SMS code, with spaces and dashes (as pasted from the message) removed. */
export function normalizeOtp(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const code = input.replace(/[\s-]/g, "");
  return /^\d{6}$/.test(code) ? code : null;
}

/** "+919876543210" -> "+91 ••••• ••210" for messages on screen (never the whole number). */
export function maskPhone(phone: string): string {
  return `${phone.slice(0, 3)} ••••• ••${phone.slice(-3)}`;
}
