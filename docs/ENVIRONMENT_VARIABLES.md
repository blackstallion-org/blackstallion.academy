# Environment variables (24 Oct 2026)

Values never appear in git, logs or documentation. Local values live in the git-ignored `.env.local` on the Mac;
deployed values live in Vercel → Project `blackstallion-academy` → Settings → Environment Variables, marked
**Sensitive** (write-only after saving). `.env.example` is the template.

Legend — **Set**: present in Vercel for Production + Preview today. **Unset**: deliberately empty. **Optional**: only
when the feature is wanted.

## Core services

| Variable | Scope | Status in Vercel | Used by | Notes |
| --- | --- | --- | --- | --- |
| `SUPABASE_URL` | server | Set | lead intake, rate limits, `/verify`, staff auth, storage | `https://<ref>.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | server | Set | same | new-format publishable key; sent only as `apikey`; RLS applies |
| `SUPABASE_SECRET_KEY` | server | Set | storing generated MOU PDFs in `private-documents` | bypasses RLS: server only, never `NEXT_PUBLIC_`. **Rotate** (it was pasted in a chat) |
| `RESEND_API_KEY` | server | Set | staff notifications, optional receipts, error alerts | **Rotate** (it was pasted in a chat) |
| `LEAD_NOTIFY_EMAIL` | server | Set | notification recipients (comma separated) | must be the Resend account owner until the domain is verified |
| `RESEND_FROM` | server | Unset | sender | after domain verification: `Black Stallion Academy <office@blackstallion.academy>` |
| `RESEND_CONFIRMATIONS` | server | Unset | applicant receipts | `1` only after domain verification and privacy-notice sign-off |
| `FORMSPREE_ENDPOINT` | server | Set | inbox/backup copy of every validated enquiry | `https://formspree.io/f/<id>` |
| `RATE_LIMIT_SALT` | server | Set | hashing client addresses for rate limits | random, 32+ chars |
| `TRUSTEE_SESSION_SECRET` | server | Set | `/schools/access` trustee sessions | random, 32+ chars |
| `TRUSTEE_INVITATIONS_JSON` | server | Unset (`[]`) | trustee invitations | SHA-256 hashes of invitation codes only |

## Behaviour switches

| Variable | Scope | Status | Effect |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_ALLOW_INDEXING` | build | Unset | `1` = robots allow indexing + sitemap link. Production only, after launch approval |
| `NEXT_PUBLIC_SITE_URL` | build | Unset | base for auth e-mail links; when empty the request origin is used (works on previews) |
| `NEXT_PUBLIC_VERCEL_ANALYTICS` | build | Unset | `1` loads cookieless Vercel Web Analytics (enable Analytics in Vercel first; owner/privacy decision) |
| `ERROR_ALERT_EMAIL` | server | Unset (optional) | alert e-mail for server errors, throttled to one per route/error every 15 minutes |
| `NEXT_PUBLIC_LOCAL_MEDIA` | build | Unset | `1` serves the PNG masters (Mac only); deployments use the WebP copies in git |
| `NEXT_PUBLIC_MEDIA_BASE_URL` | build | Unset (the switch is off) | `https://<project>.supabase.co/storage/v1/object/public/website-media`: stills, 3D models, video and audio load from that public bucket instead of from this site (`/images`, `/media`, `/models`, `/video`, `/audio`). Public address, not a secret (do not mark Sensitive). Read at build time: redeploy after changing it; remove it and redeploy to go back. An invalid value (not a clean `https://` address) is ignored. Steps and costs: `docs/MEDIA_HOSTING.md` |
| `NEXT_PUBLIC_STALLION_MODEL` | build | Unset (optional) | commissioned 3D model URL for the hero |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` | build + server | Unset | Cloudflare Turnstile bot check on all forms; set both or neither (needs a Cloudflare account) |
| `LEAD_WEBHOOK_URL` + `LEAD_WEBHOOK_SECRET` | server | Unset (optional) | extra POST per enquiry (CRM/Zapier); receiver must de-duplicate on `idempotency-key` |
| `RESEND_API_URL` | server | Unset | test override only |

## Provided by the platform (do not set)

`VERCEL_ENV` (production/preview/development), `NODE_ENV`.

## Test-only (never set in Vercel)

`BSAH_PLAYWRIGHT_MODULE`, `BSAH_E2E_PORT`, `BSAH_TEST_URL`, `BSAH_TEST_PORT`, `BSAH_TEST_OUTPUT`, `BSAH_CHECK`,
`BSAH_BROWSER_CHANNEL`, `BSAH_MOTION_*`, `BASE_URL` — used by `scripts/` and CI.

`BSAH_ALLOW_LOCAL_IMAGE_HOST=1` lets the image optimizer fetch from a stand-in media bucket on `127.0.0.1`
(`scripts/e2e-media.mjs`, `tests/asset.test.mjs`). It switches on Next's `dangerouslyAllowLocalIP`, so it must never be set
in Vercel.

## Used by the media upload tool (on the owner's Mac, never in Vercel)

`scripts/upload-media.mjs` reads `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`) and `SUPABASE_SECRET_KEY` (or the older
`SUPABASE_SERVICE_ROLE_KEY`) from the environment or from `.env.local`, and otherwise asks for the key at a hidden prompt.
The key is sent only to the project's own address, never printed and never saved. `BSAH_UPLOAD_BACKOFF_MS` (tests only)
shortens the retry delays.

## GitHub repository settings (not env vars)

| Name | Kind | Purpose |
| --- | --- | --- |
| `UPTIME_URL` | Actions **variable** | base URL probed every 30 minutes by `.github/workflows/uptime.yml` (set it at launch) |

## Payments (not used)

`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` — reserved; `lib/payments/core.ts` is tested but not
connected. Live charging needs a merchant account and the owner's approval.

## Rotation procedure (staged)

1. Create the replacement key (Resend → API Keys; Supabase → Settings → API Keys → new secret key).
2. Update `.env.local` on the Mac and the Vercel variable (Production + Preview), redeploy.
3. Verify: one synthetic enquiry reaches Supabase, Formspree and Resend (Vercel Logs: `lead.received` with channels).
4. Only then revoke the old key — after confirming no other app (e.g. the operations apps) uses it. Revocation needs
   the owner's approval.
