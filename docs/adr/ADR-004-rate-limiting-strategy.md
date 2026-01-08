# ADR-004: Rate Limiting Strategy

## Status
Accepted

## Context

The MarketData API, like most APIs, enforces rate limits to protect its infrastructure and ensure fair usage among clients. The SDK needs to:
- Track current rate limits from API responses
- Prevent requests when rate limits are exceeded
- Provide visibility to users about their current usage
- Update rate limit information after each request
- Initialize rate limits on client startup

Without a rate limiting strategy:
- Users could unknowingly exhaust their rate limit quota
- Requests would fail with 429 (Too Many Requests) errors
- Users have no visibility into their remaining quota
- Inconsistent rate limit state across multiple requests

## Decision

We implemented a **proactive rate limiting tracking and enforcement system** with the following components:

### 1. Rate Limit Data Model

```typescript
// In types.ts
export interface UserRateLimits {
  requestsLimit: number;        // Total requests allowed
  requestsRemaining: number;    // Requests remaining in current window
  requestsReset: number;        // Unix timestamp when limit resets
  requestsConsumed: number;     // Total requests consumed
}
```

**Rationale**:
- **Simple interface**: Clean structure for rate limit info
- **Unix timestamp**: API returns Unix timestamp for reset time
- **All required fields**: Covers tracking consumed, remaining, limits, and reset time
- **Optional property**: `rateLimits` can be undefined before initialization

### 2. Initialization Strategy

Rate limits are fetched during client initialization or on first request:

```typescript
// In client.ts
export class MarketDataClient implements IMarketDataClient {
  public rateLimits?: UserRateLimits;
  private _rateLimitSetup?: Promise<void>;

  private async _setupRateLimits(): Promise<void> {
    if (this._rateLimitSetup) return this._rateLimitSetup;
    
    this._rateLimitSetup = (async () => {
      try {
        await this._makeRequest('user/', undefined, {
          includeApiVersion: false,
          skipRateLimitCheck: true,    // Don't check limits on first request
        });
      } catch (error) {
        this.logger.error(`Failed to setup rate limits: ${error.message}`);
      } finally {
        this._rateLimitSetup = undefined;
      }
    })();
    
    return this._rateLimitSetup;
  }
}
```

**Rationale**:
- **Lazy initialization**: Limits fetched on first API call (if token provided)
- **Skip validation on init**: First request shouldn't check limits (none set yet)
- **Dedicated endpoint**: `/user/` endpoint is lightweight and returns rate limit headers
- **Promise caching**: Prevents concurrent initialization race conditions

### 3. Rate Limit Extraction

After every response, rate limits are extracted from HTTP headers:

```typescript
// In client.ts
private _updateRateLimits(headers: Headers): void {
  if (headers.has('x-api-ratelimit-remaining')) {
    this.rateLimits = {
      requestsLimit: Number(headers.get('x-api-ratelimit-limit')) || 0,
      requestsRemaining: Number(headers.get('x-api-ratelimit-remaining')) || 0,
      requestsReset: Number(headers.get('x-api-ratelimit-reset')) || 0,
      requestsConsumed: Number(headers.get('x-api-ratelimit-consumed')) || 0,
    };
  }
}
```

**Headers Used**:
- `x-api-ratelimit-limit`: Total requests allowed in current window
- `x-api-ratelimit-remaining`: Requests remaining
- `x-api-ratelimit-consumed`: Total requests consumed
- `x-api-ratelimit-reset`: Unix timestamp of next reset

**Rationale**:
- **Every response**: Rate limits are updated after each request
- **Header-based**: Follows REST API best practices
- **Type conversion**: Headers are strings, converted to numbers
- **Defensive programming**: Uses `||0` fallback for missing values

### 4. Pre-request Validation

Before making requests, rate limits are checked:

```typescript
// In client.ts
private _checkRateLimits(): void {
  if (this.rateLimits && this.rateLimits.requestsRemaining <= 0) {
    throw new RateLimitError('Rate limit exceeded');
  }
}

private async _executeWithRetry<T>(..., options = {}): Promise<T> {
  return await pRetry(
    async () => {
      // Setup rate limits on first request if token provided
      if (this.token && !this.rateLimits && !options.skipRateLimitCheck) {
        await this._setupRateLimits();
      }
      
      // Check rate limits before request
      if (!options.skipRateLimitCheck) {
        this._checkRateLimits();
      }
      
      const response = await fetch(url.toString(), { headers, method: 'GET' });
      
      // Update rate limits from response
      this._updateRateLimits(response.headers);
      
      // ... handle response
    },
    { /* retry config */ }
  );
}
```

**Rationale**:
- **Fail early**: Prevent requests that would be rejected by the server
- **Configurable**: `skipRateLimitCheck` flag allows bypassing for specific requests
- **Automatic setup**: Rate limits initialized transparently on first request
- **Logging**: Errors are logged for debugging

### 5. User Access to Rate Limits

Users can access current rate limit information:

```typescript
const client = new MarketDataClient({ token: 'YOUR_TOKEN' });

// Make some requests
await client.stocks.prices('AAPL');

// Access rate limits object
const rateLimits = client.rateLimits;

if (rateLimits) {
  console.log(`Limit: ${rateLimits.requestsLimit}`);
  console.log(`Remaining: ${rateLimits.requestsRemaining}`);
  console.log(`Consumed: ${rateLimits.requestsConsumed}`);
  console.log(`Reset at: ${new Date(rateLimits.requestsReset * 1000)}`);
}
```

**Benefits**:
- **Transparency**: Users can see their quota and plan requests accordingly
- **Predictability**: Users know when limits will reset
- **Debugging**: Useful for troubleshooting rate limit issues

## Consequences

### Positive
- **Proactive protection**: Prevents rate limit errors before they happen
- **User visibility**: Clear understanding of rate limit usage
- **Automatic updates**: Rate limits tracked automatically without user intervention
- **Centralized tracking**: Single source of truth for rate limit state
- **Early failure**: Detect rate limit exhaustion immediately, not after server error
- **Standard headers**: Follows REST API conventions for rate limiting

### Negative
- **Additional HTTP calls**: Initialization requires an extra request to `/user/` endpoint
- **Assumes header presence**: Will not track limits if API doesn't include rate limit headers
- **Conservative approach**: May prevent valid requests if rate limit info is stale
- **State management**: Need to maintain `rateLimits` object in client

### Mitigations
- The `/user/` request is lightweight and only happens once (or on first request with token)
- Rate limit checking can be skipped per request with `skipRateLimitCheck` flag
- Rate limits are updated after every successful response
- If no token provided, rate limit tracking is skipped entirely (demo mode)

## Alternatives Considered

### Alternative 1: Reactive checking (fail and retry)
```typescript
try {
  response = await fetch(url);
} catch (error) {
  if (error.status === 429) {  // Rate limited
    await sleep(retryAfter);
    return retry();
  }
}
```

**Pros**: No need to track rate limits locally
**Cons**: Wastes bandwidth on failed requests, slower user experience, reactive not proactive

### Alternative 2: No rate limiting enforcement
```typescript
// Allow user to make requests, don't check limits
// User is responsible for managing quota
```

**Pros**: Simpler code, less overhead
**Cons**: Poor user experience, 429 errors at runtime, no visibility into quota

### Alternative 3: Client-side rate limiting (queue)
```typescript
// Implement request queue with throttling
const queue = new PQueue({ intervalCap: 100, interval: 60000 });
```

**Pros**: Prevents exceeding limits
**Cons**: Doesn't account for server-side state, inaccurate if limits change, complex implementation

### Alternative 4: Polling /user/ endpoint
```typescript
// Periodically refresh rate limits
setInterval(() => {
  this.rateLimits = await fetchRateLimits();
}, 60000);
```

**Pros**: Always has fresh rate limit data
**Cons**: Unnecessary API calls, wastes quota, doesn't update after each request

## References

- [HTTP Rate Limiting Headers](https://tools.ietf.org/html/draft-polli-ratelimit-headers)
- [GitHub API Rate Limiting](https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting)
- Relevant files:
  - `src/types.ts` - `UserRateLimits` interface
  - `src/client.ts` - Rate limit methods (`_checkRateLimits`, `_updateRateLimits`, `_setupRateLimits`)
  - `src/error.ts` - `RateLimitError` class
