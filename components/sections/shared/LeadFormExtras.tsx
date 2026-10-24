"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const ATTR = ["path", "hub", "campaign", "qr", "referrer", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
const FIRST_TOUCH = "bsah-first-touch";
const keyName = (gate: string) => `bsah-lead-key-${gate}`;

function storage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function newKey() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Forget the stored key once a submission is confirmed, so the next enquiry is a new one. */
export function clearLeadKey(gate: string) {
  storage()?.removeItem(keyName(gate));
}

/** Campaign tags from the first page of this visit (kept for the tab only), then the current URL. */
function readAttribution(hub?: string): Record<string, string> {
  const out: Record<string, string> = {};
  const params = new URLSearchParams(window.location.search);
  let first: Record<string, string> = {};
  try {
    first = JSON.parse(storage()?.getItem(FIRST_TOUCH) || "{}");
  } catch {}
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "qr", "campaign"]) {
    const v = params.get(k) || first[k];
    if (v) out[k] = v.slice(0, 200);
  }
  if (!Object.keys(first).length && Object.keys(out).length) storage()?.setItem(FIRST_TOUCH, JSON.stringify(out));
  out.path = window.location.pathname;
  if (document.referrer) {
    try {
      const host = new URL(document.referrer).host;
      if (host && host !== window.location.host) out.referrer = host;
    } catch {}
  }
  if (hub) out.hub = hub;
  return out;
}

/**
 * Shared bookkeeping for every enquiry form: explicit consent, privacy-conscious attribution, an idempotency key that
 * survives retries (so a double click or a timeout retry cannot create two leads), and Turnstile when configured.
 * Values are written to the hidden inputs after hydration, so server HTML and client HTML match.
 */
export function LeadFormExtras({ gate, hub, error, className }: { gate: string; hub?: string; error?: string; className?: string }) {
  const keyRef = useRef<HTMLInputElement>(null);
  const attrRefs = useRef<Partial<Record<(typeof ATTR)[number], HTMLInputElement | null>>>({});
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    const store = storage();
    let key = store?.getItem(keyName(gate)) || "";
    if (!/^[A-Za-z0-9_-]{16,64}$/.test(key)) {
      key = newKey();
      store?.setItem(keyName(gate), key);
    }
    if (keyRef.current) keyRef.current.value = key;
    const attribution = readAttribution(hub);
    for (const k of ATTR) {
      const input = attrRefs.current[k];
      if (input) input.value = attribution[k] ?? "";
    }
    // React 19 resets uncontrolled fields after a form action, so the values are also injected whenever the form's
    // data is collected. The stored key is re-read so a retry after a failure keeps the same idempotency key.
    const form = keyRef.current?.form;
    if (!form) return;
    const inject = (event: FormDataEvent) => {
      let current = storage()?.getItem(keyName(gate)) || "";
      if (!current) {
        // The previous enquiry was confirmed (key cleared): this is a new one.
        current = newKey();
        storage()?.setItem(keyName(gate), current);
      }
      event.formData.set("idem", current);
      for (const k of ATTR) if (attribution[k]) event.formData.set(`attr_${k}`, attribution[k]);
    };
    form.addEventListener("formdata", inject);
    return () => form.removeEventListener("formdata", inject);
  }, [gate, hub]);

  return (
    <div className={cn("flex flex-col gap-1 sm:col-span-2", className)}>
      {/* No value/defaultValue prop: React would re-apply it on every parent re-render and wipe what the effect wrote. */}
      <input ref={keyRef} type="hidden" name="idem" />
      {ATTR.map((k) => (
        <input key={k} ref={(el) => { attrRefs.current[k] = el; }} type="hidden" name={`attr_${k}`} />
      ))}
      <label className="t-ui flex items-start gap-3 text-sm text-sand">
        <input
          type="checkbox"
          name="consent"
          value="yes"
          required
          aria-required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `consent-${gate}-err` : undefined}
          className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-gold)]"
        />
        <span>
          I agree that BSAH may use these details only to reply to this enquiry. If the enquiry concerns a child, I am their
          parent, guardian or an authorised school representative.{" "}
          <Link href="/privacy" className="underline decoration-line underline-offset-2 hover:text-bone">
            Privacy notice (draft, pending legal review)
          </Link>
        </span>
      </label>
      {error && (
        <p id={`consent-${gate}-err`} className="t-ui text-xs text-blood">
          {error}
        </p>
      )}
      {siteKey && (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
          <div className="cf-turnstile mt-2" data-sitekey={siteKey} data-theme="light" />
        </>
      )}
    </div>
  );
}
