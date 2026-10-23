# Trustee access: production setup

The gateway lives at `/schools/access`. It rejects all invitations while configuration is missing. Test invitations used during local verification were temporary and are not production credentials.

1. Set `TRUSTEE_SESSION_SECRET` in the hosting provider's secret environment to at least 32 random characters (48 random bytes encoded as hex recommended). Never prefix it with `NEXT_PUBLIC_`.
2. Issue a unique cryptographically random code for each institution (at least 16 characters; 24 random bytes encoded as hex recommended). Deliver it through the physical passport. Do not reuse a shared school password.
3. Compute the SHA-256 hex hash of each code. Set `TRUSTEE_INVITATIONS_JSON` to an array with `id`, `institution`, `codeHash`, and ISO `expiresAt` values. `.env.example` documents the shape. Keep raw codes out of source control and logs.
4. Removing an entry, changing its ID or expiring it invalidates its sessions. Rotating the signing secret invalidates every session. Sessions last at most one hour and never outlast an invitation.
5. Sessions use signed cookies with HttpOnly, SameSite=Strict, a scoped path, and Secure in production. Sign-out clears the browser cookie. A copied bearer session remains valid until expiry or invitation/secret revocation; this implementation does not maintain a separate per-session revocation database.
6. Configure hosting edge rate limits for the gateway/Server Action requests before external launch. The fixed server delay discourages enumeration but is not a distributed rate limiter. Never issue short or guessable codes.
7. Replace discussion copy and conceptual plans with approved institutional documents. Confidential documents must remain outside `public/` and must be served through an authorization check; do not link an unprotected public PDF from a protected screen.
8. The MoU interface submits an enquiry through the existing lead service. It does not reserve calendar slots or execute an MoU. Validate production delivery using an approved test contact before launch.

## Verification

Run `node scripts/test-trustee-security.mjs` for correct/wrong codes, signature tampering, expiry, invitation revocation and missing configuration. Browser verification additionally covered unauthorized content exclusion, valid institution access, HttpOnly/Strict cookies and logout.

No authentication plugin is required. For a larger institution directory, replace the environment-backed invitation registry with a managed identity/invitation store and distributed rate limiting while retaining authorization at every private resource.
