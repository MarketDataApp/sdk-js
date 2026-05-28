# Utilities

The JavaScript SDK from Market Data provides methods designed to streamline your use of the following Utilities endpoints. These methods provide a seamless interface for accessing diagnostic data: service status and request-header inspection.

Both utilities skip the per-token rate-limit gate and bypass the `/v1/` URL prefix, so they remain reachable even when your account is throttled.

Rate-limit data is exposed on the client itself — see [`client.rateLimits`](../client.md#RateLimits), which the SDK populates automatically at startup from the same `/user/` response headers.

## Utilities Endpoints
