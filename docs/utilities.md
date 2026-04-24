# Utilities Resource

Three diagnostic endpoints live on `client.utilities`: service health, a header echo, and the token-level rate-limit snapshot.

```typescript
import { MarketDataClient } from "marketdata-sdk";

const client = new MarketDataClient();
```

All three utilities bypass the rate-limit gate and skip the API-version prefix in the URL.

## Methods

### `user()`

Returns the token's rate-limit snapshot and plan metadata. The client's constructor calls this automatically to populate `client.rateLimits` unless `skipStartupValidation: true` is passed.

```typescript
const u = await client.utilities.user();
console.log(u.plan, u.remaining, "credits left until", new Date(u.reset! * 1000));
```

A 401 response rejects with `AuthenticationError` — that's the signal for a bad or expired token.

### `status()`

Service-level health across every endpoint. No token required, so this works in demo mode.

```typescript
const s = await client.utilities.status();
for (let i = 0; i < s.service.length; i++) {
  console.log(s.service[i], s.status[i], "online:", s.online[i]);
}
```

The SDK's retry loop hits this endpoint automatically before retrying a 5xx response — if the service is marked OFFLINE, the retry short-circuits. See [ADR-003](adr/ADR-003-retry-logic-and-service-status.md).

### `headers()`

Echoes the request headers your client sent. Auth is redacted server-side. Useful for debugging proxies or custom header plumbing.

```typescript
const h = await client.utilities.headers();
console.log(h["user-agent"]); // "marketdata-sdk-javascript/0.0.1"
```

## When to use which

| Need | Call |
|---|---|
| "Is my token valid right now?" | `await client.ready` (fires `user()` automatically), or call `user()` directly. |
| "Can I reach the API at all?" | `utilities.status()` — no auth required. |
| "What headers is my client actually sending?" | `utilities.headers()`. |

## Further reading

- REST endpoints: [status](https://www.marketdata.app/docs/api/utilities/status), [headers](https://www.marketdata.app/docs/api/utilities/headers), [user](https://www.marketdata.app/docs/api/utilities/user).
