# Telephony recovery verification — 2026-10-14

Local regression fixture: `node scripts/serve-telephony-recovery-fixture.mjs`, served on `127.0.0.1:4175`.
It bundles the actual TelephonyProvider, Zustand store and SipClient with explicit auth, protocol, media and logging doubles. It never connects to production or places a PSTN call.

Observed in a Playwright Chromium session: 16/16 scenarios passed, zero browser page errors.

- React StrictMode creates one live registration.
- Token refresh preserves an existing registration.
- Token refresh during pending configuration does not strand setup.
- Transport loss automatically obtains configuration and reconnects.
- Retried requests use the refreshed token.
- A failed client is retired before a replacement becomes Ready.
- Role change to non-agent disconnects the client.
- Server 403 stops retries and never provisions SIP.
- Slow call-log insertion does not block the SIP INVITE.
- A late log insertion receives the ended call's result.
- SIP REGISTER waits for the transport start promise.
- Ready requires both a live transport and registered state.
- SIP 486 is recorded as BUSY with a visible response code.
- SIP 503 is recorded as FAILED with a visible response code.
- Transport loss clears Ready; disposed callbacks are ignored.
- SIP registration refusal exposes the code and fails closed.

Some bullets combine closely related assertions; the browser execution recorded 16 distinct checks.

Production release checks: `node scripts/check-telephony-release.mjs <baseline-directory>` checks known local secret values and service-role JWTs without printing them. Public Supabase anon credentials are not classified as private SIP credentials.

Automated command: `pnpm test:telephony` (also included in the workspace `pnpm test` run).

- `check-phone-normalization.mjs` executes the real outbound normalizer and rejects any implicit country prefix.
- `check-telephony-call-lifecycle.mjs` executes the real Zustand telephony store with explicit SIP/media/logging doubles. It places five sequential Armenian-number attempts, verifies the exact `+37491500065` destination, forces a provider failure after every attempt, and proves that `activeCall` is cleared and the phone returns to `READY` without a page refresh.

Not proven by this fixture: authenticated production REGISTER, PSTN ringing, actual displayed caller ID, simultaneous real calls, microphone intelligibility or two-way audio. Those need a controlled real call and confirmation from its recipient.
