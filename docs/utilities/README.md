# Utilities (JavaScript SDK)

The JavaScript SDK from Market Data provides methods designed to streamline your use of the following Utilities endpoints. These methods provide a seamless interface for accessing diagnostic data: service status and request-header inspection.

Both utilities skip the per-token rate-limit gate and bypass the `/v1/` URL prefix, so they remain reachable even when your account is throttled.

Rate-limit data is exposed on the client itself — see [`client.rateLimits`](../client.md#accessing-rate-limits), which the SDK populates automatically at startup from the same `/user/` response headers.

## Utilities Endpoints

- [API Status (JavaScript SDK)](./status.md) — Retrieve health information for every Market Data endpoint with the JavaScript SDK. No token is needed, and the SDK probes it before a retry.
- [Headers (JavaScript SDK)](./headers.md) — Echo back the request headers your JavaScript SDK client sent, to debug a proxy, custom header plumbing, or the user agent it presents.
