"use client";

import { useActionState, useState } from "react";
import { unlockInstitution } from "./actions";

export function AccessForm() {
  const [state, action, pending] = useActionState(unlockInstitution, null);
  const [passcode, setPasscode] = useState("");
  return <form action={action} className="mt-10 max-w-lg space-y-5" aria-busy={pending}>
    <label htmlFor="institutional-passcode" className="label block text-brass">Enter Institutional Passcode</label>
    <input id="institutional-passcode" name="passcode" type="password" value={passcode} onChange={(event) => setPasscode(event.target.value)} autoComplete="current-password" autoCapitalize="none" spellCheck={false} required minLength={16} maxLength={128} className="field w-full" aria-invalid={!!state?.error} aria-describedby={state?.error ? "access-error access-hint" : "access-hint"} />
    <p id="access-hint" className="text-sm text-sand">Use the unique invitation code inside your physical passport. Access expires automatically after one hour.</p>
    {state?.error && <p id="access-error" role="alert" className="border border-brass p-4 text-sm text-bone">{state.error}</p>}
    <button disabled={pending} className="label min-h-12 bg-gold px-6 py-4 text-night disabled:opacity-60">{pending ? "Verifying invitation…" : "Unlock institutional proposal"}</button>
  </form>;
}
