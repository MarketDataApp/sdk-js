# ADR-008 — Eager startup `/user/` validation

**Status**: Accepted (2026-04-24). Supersedes the ADR-004 "lazy init" decision for rate-limit setup.

## Context

ADR-004 defined `_setupRateLimits` as a lazy, first-request-triggered call to `/user/` that doubles as both a rate-limit snapshot and a token-validity probe. This conflicted with two explicit requirements in the SDK requirements spec §6.1:

1. **Fail-fast on invalid tokens.** A caller who instantiates a client with a bad token should find out immediately — not on the first data-bearing call minutes later, possibly from deep inside a batch pipeline.
2. **Explicit opt-out for serverless.** Cold-start latency matters on FaaS platforms; the spec requires an opt-out flag so integrators can skip the pre-flight `/user/` round-trip.

Additionally, the lazy implementation had a concurrent-flood failure mode: if `_setupRateLimits` threw and cleared `_rateLimitSetup`, subsequent requests would dispatch without rate-limit gating because `_reserveRateLimitCredit` only gated on `this.rateLimits` being truthy.

## Decision

Validation runs **eagerly from the constructor**. The client exposes a public `ready: Promise<void>` field:

- On construction, if a token is present and `skipStartupValidation !== true`, the constructor kicks off the eager `/user/` probe.
- `AuthenticationError` (401) propagates: `client.ready` rejects and all subsequent requests reject when they `await this.ready`.
- Transient errors (`NetworkError`, `ServerError`) are logged and swallowed; `ready` resolves so normal requests can retry the underlying operation.
- `skipStartupValidation: true` bypasses the call entirely — the `ready` Promise resolves immediately.
- Callers with no token skip the call as well; demo-mode flows don't need `/user/`.

`_performFetch` now `await this.ready` at the top of every request (unless `skipRateLimitCheck: true`, the existing flag for bootstrap calls — the eager `/user/` probe and `utilities.status()` use it to avoid recursing).

The lazy `_setupRateLimits` method and the `_rateLimitSetup` promise cache are removed.

## Consequences

- **Behavioural change**: client construction now has a side effect (a network call) when a token is supplied. Callers who construct clients in hot paths without awaiting `ready` may observe a small latency bump on the first request while the startup completes.
- **Backward-compat**: consumers who ignore `ready` are still correct — internal gating awaits it on their behalf. The spec-required `skipStartupValidation` flag is additive.
- **Tests**: mocked tests that previously relied on lazy `/user/` triggering on the first `client.stocks.X()` call must now install their mock before `new MarketDataClient(...)`, or pass `skipStartupValidation: true`. `tests/csv.test.ts` and `tests/rate_limits.test.ts` were updated to install mocks first.
- **Failure-path hardening**: if startup fails non-authoritatively, we proceed without a rate-limit snapshot. The TOCTOU guard from the rate-limit-race patch still protects against over-dispatch once the first real response lands.

## Alternatives considered

- **Async factory `MarketDataClient.create()`**: makes validation explicit but forces every user to know about `await` on construction. Rejected — Promise field is lighter and backward-compatible.
- **Gate all requests on `await ready`, rejecting on any startup failure**: simpler but makes transient network failures at startup catastrophic. Rejected — only auth failures are fatal per spec.
- **Keep `_setupRateLimits` lazy, add a separate eager path**: two code paths for the same thing, easy to drift. Rejected.
