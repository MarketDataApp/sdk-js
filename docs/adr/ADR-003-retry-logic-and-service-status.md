# ADR-003: Retry Logic and Service Status Checking

## Status
Accepted

## Context

The SDK must interact with the MarketData API, which like any cloud service can experience:
- Transient errors (timeouts, rate limiting, unstable connection)
- Specific service unavailability
- Service degradation

Without an intelligent retry strategy:
- Users experience failures that could have been automatically resolved
- No differentiation between permanent and transient errors
- The SDK could saturate the server with retries without exponential backoff
- No visibility into the current state of services

## Decision

We implemented a three-layer strategy:

### Layer 1: Custom Exception Hierarchy

We defined specific exception types to distinguish between transient and permanent errors:

```typescript
// In error.ts
export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class RequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RequestError';
    Error.captureStackTrace(this, this.constructor);
  }
}
```

**Rationale**:
- **Transient errors** (`RateLimitError`, `RequestError`): Can be retried
- **Permanent errors** (`AbortError` from p-retry): Should not be retried
- **Error.captureStackTrace**: Maintains proper stack traces for debugging

This separation enables:
- Intelligent retry logic that knows which exceptions to retry
- Consistent error handling across the SDK
- Better error messages and logging

### Layer 2: Intelligent Retries with p-retry

We use the **p-retry** library for declarative retry logic with exponential backoff:

```typescript
// In client.ts
private async _executeWithRetry<T>(
  url: URL,
  headers: Record<string, string>,
  schema?: z.ZodType<T>,
  service?: string,
  options: {
    skipRateLimitCheck?: boolean;
    skipRetry?: boolean;
    signal?: AbortSignal;
  } = {},
): Promise<T> {
  return await pRetry(
    async () => {
      // Request logic here
      const response = await fetch(url.toString(), { headers, method: 'GET' });
      
      if (!response.ok) {
        await this._handleResponseError(response, service);
      }
      
      return response.json();
    },
    {
      retries: options.skipRetry ? 0 : this.settings.marketdataMaxRetries,
      minTimeout: this.settings.marketdataRetryInitialWait * 1000,
      maxTimeout: this.settings.marketdataRetryMaxWait * 1000,
      factor: this.settings.marketdataRetryFactor,
      onFailedAttempt: (error) => {
        this.logger.warn(
          `Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`
        );
      },
    },
  );
}
```

**Features**:
- **Exponential Backoff**: Wait increases exponentially between retries (configurable min/max)
- **Configurable Retries**: Number of attempts, backoff factor, timeouts from settings
- **Automatic Logging**: Records each failed attempt
- **AbortError**: Thrown for permanent errors to stop retries immediately

### Layer 3: Proactive Service Status Checking

We implemented **APIStatusData** to query and cache service status:

```typescript
// In apiStatus.ts
export class APIStatusData {
  private status: Record<string, APIStatusResult> = {};
  private lastRefresh = 0;

  async getApiStatus(
    client: IMarketDataClient,
    service: string
  ): Promise<APIStatusResult> {
    // Refresh if stale
    if (this.shouldRefresh) {
      await this.refresh(client);
    }
    
    // Check service status
    const serviceStatus = this.status[service];
    return serviceStatus ?? APIStatusResult.UNKNOWN;
  }
  
  private async refresh(client: IMarketDataClient): Promise<void> {
    // Call /status/ endpoint to get current status
    const response = await client._makeRequest('/status/', undefined, {
      includeApiVersion: false,
      skipRateLimitCheck: true,
    });
    
    this.updateStatus(response);
    this.lastRefresh = Date.now();
  }
}

export const globalApiStatus = new APIStatusData();
```

**Features**:
- **Smart Cache**: Only refresh if `REFRESH_API_STATUS_INTERVAL` has passed
- **Service-specific Status**: Tracks individual service availability
- **Global Singleton**: `globalApiStatus` shared across the application
- **Lazy Loading**: Status fetched only when needed

### Integration

```typescript
// In client.ts - error handling
private async _handleResponseError(
  response: Response,
  service?: string,
): Promise<never> {
  const text = await response.text();
  
  if (response.status === 429) {
    throw new RateLimitError(`Rate limit exceeded: ${text}`);
  }
  
  const requestError = new RequestError(
    `Request failed (${response.status}): ${text}`
  );
  
  // Check if retriable and service-specific
  if (isRetriableStatusCode(response.status) && service) {
    await this._checkServiceStatus(service, requestError);
    throw requestError;  // Retry
  }
  
  throw new AbortError(requestError);  // Don't retry
}

private async _checkServiceStatus(
  service: string,
  error: Error,
): Promise<void> {
  const status = await globalApiStatus.getApiStatus(this, service);
  if (status === APIStatusResult.OFFLINE) {
    this.logger.error(`Service ${service} is OFFLINE. Aborting retries.`);
    throw new AbortError(error);  // Stop retrying
  }
}
```

## Consequences

### Positive
- **Automatic Resilience**: Transient errors are automatically retried
- **User Experience**: Fewer apparent failures in unstable network conditions
- **Exponential Backoff**: Prevents saturating the server with aggressive retries
- **Proactive Visibility**: Client knows if a service is down before exhausting retries
- **Status Cache**: No need to consult `/status/` on every request
- **Automatic Logging**: Each failed attempt is recorded
- **Configurable**: Retry parameters can be adjusted via settings

### Negative
- **Additional Latency**: In case of errors, wait time is added
- **Complexity**: More code to handle retries and status
- **False Positives**: Status cache could be stale (mitigated with refresh interval)
- **No Success Guarantee**: A down service will still fail, just with better error messages

### Mitigations
- Users can configure retry parameters via `MarketDataConfig`
- Status cache refresh interval is configurable in `internalSettings.ts`
- All events are logged for debugging
- `skipRetry` option available for time-sensitive operations

## Alternatives Considered

### Alternative 1: No retries, fail fast
```typescript
const response = await fetch(url);
if (!response.ok) {
  throw new Error('Request failed');
}
```

**Pros**: Simple, fast
**Cons**: Users experience failures that could have been avoided

### Alternative 2: Naive retries (fixed sleep)
```typescript
for (let i = 0; i < 3; i++) {
  try {
    return await fetch(url);
  } catch (error) {
    await sleep(1000);  // Fixed wait
  }
}
```

**Pros**: Simple
**Cons**: Doesn't scale well, can saturate the server, no exponential backoff

### Alternative 3: No proactive status checking
```typescript
// Only rely on retries, don't consult /status/
```

**Pros**: Fewer requests to the server
**Cons**: No visibility into down services, user experiences failed retries unnecessarily

### Alternative 4: Different retry library (axios-retry)
```typescript
import axiosRetry from 'axios-retry';
```

**Pros**: Works with axios
**Cons**: Requires axios (heavier), less flexible, SDK uses native fetch

## References

- [p-retry Documentation](https://github.com/sindresorhus/p-retry)
- [Exponential Backoff Pattern](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- Relevant files:
  - `src/client.ts` - `_executeWithRetry`, `_handleResponseError`, `_checkServiceStatus`
  - `src/apiStatus.ts` - `APIStatusData` class and `globalApiStatus` singleton
  - `src/error.ts` - Custom exception classes
  - `src/internalSettings.ts` - Retry and refresh interval configuration
