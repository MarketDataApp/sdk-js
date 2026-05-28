# JavaScript SDK

Welcome to the Market Data JavaScript SDK documentation. This SDK allows you to integrate Market Data services into your Node.js and TypeScript applications. It ships typed responses, runtime schema validation, and a functional error-handling pattern.

> [!NOTE]
> The JavaScript SDK is in early development (version `0.0.1`). The API surface and return types may change before 1.0.

## Quick Start

```typescript
import { MarketDataClient } from "marketdata-sdk";

// Initialize client
const client = new MarketDataClient({
  token: "YOUR_API_TOKEN", // Optional - runs in demo mode without token
});

// Get stock prices
const prices = await client.stocks.prices("AAPL");
console.log(prices[0].mid); // 150.25

// Get historical candles
const candles = await client.stocks.candles("AAPL", {
  resolution: "1H",
  from: new Date("2024-01-01"),
  to: new Date("2024-01-31"),
});

// Get market status
const status = await client.markets.status();
```

## Open Source

The SDK is open source and available on GitHub. Feel free to contribute to the project, report bugs, or request new features.

- [JavaScript SDK GitHub](https://github.com/MarketDataApp/sdk-js/)

## Documentation

The best source for documentation on the SDK is right here. This documentation is the most up-to-date and accurate source of information on the SDK.

## Using the SDK

This SDK is designed to help you get up and running with Market Data's APIs as quickly as possible, providing you with all the tools you need to access real-time stock and options prices, historical data, and much more.

### Getting Started

1. [Install the SDK](./installation.md) into a Node.js or TypeScript project.
2. Set up your [authentication token](./authentication.md) to access the API.
3. Learn about the [client](./client.md) and how to make your first API requests.
4. Configure [Settings](./settings.md) to customize output format, date format, and other universal parameters.
5. Explore the available endpoints for [stocks](./stocks/README.md), [options](./options/README.md), [funds](./funds/README.md), [markets](./markets/README.md), and [utilities](./utilities/README.md).

### Support

- If you have any questions or need further assistance, please don't hesitate to open a ticket at our [helpdesk](https://www.marketdata.app/dashboard/).
- If you find a bug you may also [open an issue in our GitHub repository](https://github.com/MarketDataApp/sdk-js/issues). Please only open issues if you find a bug. Use our helpdesk for general questions or implementation assistance.
