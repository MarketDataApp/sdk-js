# Delete Token (JavaScript SDK)

Revoke the API token your client is authenticating with. The token in `Authorization: Bearer {token}` is the one that gets revoked — the endpoint takes no parameters.

> [!WARNING]
> Once revoked, the token can no longer authenticate any request, including further calls on the same client. Generate a new token from the [Market Data Dashboard](https://www.marketdata.app/dashboard/) before the old one is revoked if you need uninterrupted access.

## Making Requests

Use the `deleteToken()` method on the `utilities` resource.

| Output Format          | Result Payload       | Description                              |
|------------------------|-----------------------|-------------------------------------------|
| **internal** (default) | `DeleteTokenResponse` | `{ s: "ok" }` on success.                 |
| **json**               | Raw JSON object       | The raw response as returned by the API. |

<a name="deleteToken"></a>
## deleteToken

```typescript
deleteToken(): MarketDataPromise<DeleteTokenResponse>
```

Revokes the current token. Takes no parameters.

### Returns

- [`MarketDataPromise<DeleteTokenResponse>`](../client.md#marketdatapromise)

Unlike [`status()`](./status.md) and [`headers()`](./headers.md), a 404 here is not treated as "no data" — it rejects with `NotFoundError`, since a caller awaiting a revocation needs to know it did not happen.

### Default

```typescript
import { MarketDataClient } from "@marketdata/sdk";

const client = new MarketDataClient({ token: "your_token_here" });

try {
  await client.utilities.deleteToken();
  console.log("Token revoked");
} catch (error) {
  console.error(error);
}
```

<a name="DeleteTokenResponse"></a>
## DeleteTokenResponse

```typescript
interface DeleteTokenResponse {
  s: "ok";
}
```

### Properties

- `s` (`"ok"`): Status literal confirming the token was revoked.
