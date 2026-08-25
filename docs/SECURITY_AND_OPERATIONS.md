# Security and operations

This document separates controls already implemented in the application from
production controls that still depend on the selected hosting environment.

## Implemented

- Owner, Administrator, and Editor permissions are enforced by the API.
- Staff passwords use salted PBKDF2-SHA256 hashes.
- Sessions are random, stored only as hashes, expire after eight hours, and use
  HttpOnly, SameSite, and Secure cookies when served over HTTPS.
- New staff accounts must change their temporary password.
- Login attempts are throttled in MySQL and successful logins clear the counter.
- Browser mutations require the request Origin to match the application origin.
- Protected API results use `Cache-Control: no-store`.
- Next.js adds CSP, anti-framing, MIME sniffing, referrer, permissions,
  cross-origin, and HTTPS transport headers.
- Uploads are limited to 15 MB, use an explicit format allowlist, reject SVG,
  verify file signatures, and receive random object keys.
- Post edits preserve the previous record as a revision.
- Sign-in, staff, post, media, password, and inquiry-status actions are audited.
- Public inquiries require consent, include a bot trap, have strict length
  limits, and are rate-limited.
- CI lints, tests, builds, and rejects high-severity production dependency
  advisories.

The locked production dependency audit currently reports zero known
vulnerabilities. The development-only toolchain still includes advisories in
transitive lint and migration packages; those packages are not shipped to the
public runtime, and the development server must never be exposed publicly.

## Required before production

- Verify the Hostinger Cloud Startup Node.js and MySQL deployment.
- Store bootstrap and AI credentials in managed runtime secrets.
- Configure MFA through an approved identity provider.
- Apply the MySQL schema and verify rollback in staging.
- Configure encrypted MySQL and media-object backups.
- Perform a restore drill and record recovery time and recovery point results.
- Configure uptime, error-rate, storage, and authentication-abuse alerts.
- Review privacy, retention, consent, accessibility, and charity statements with
  the organisation's authorised decision-maker.
- Complete penetration testing before accepting sensitive production traffic.

## Deferred integrations

n8n AI automation webhooks for published posts and inquiry alerts may be enabled
through protected environment secrets. Facebook/Telegram channel credentials,
payments, donations, and automatic public replies remain inactive until
explicit credentials, least-privilege setup, written approval, staging tests,
and a documented rollback are completed.
