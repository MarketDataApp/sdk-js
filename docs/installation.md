# Installation (JavaScript SDK)

This guide will help you install the Market Data JavaScript SDK and configure it for your needs.

## Prerequisites

- Node.js >= 20
- A package manager: [pnpm](https://pnpm.io/) (used by the SDK itself), [npm](https://npmjs.com), or [yarn](https://yarnpkg.com)

## Basic Installation

### pnpm

```bash
pnpm add @marketdata/sdk
```

### npm

```bash
npm install @marketdata/sdk
```

### yarn

```bash
yarn add @marketdata/sdk
```

## TypeScript Support

The SDK is written in TypeScript and ships first-class type definitions. No `@types/*` package is needed. The SDK builds to both ESM and CommonJS, so it works with either module system.

- **ESM**: `import { MarketDataClient } from "@marketdata/sdk";`
- **CommonJS**: `const { MarketDataClient } = require("@marketdata/sdk");`

## Local Development Installation

For local development, clone the repository and install from the project directory:

```bash
# Clone the repository
git clone https://github.com/MarketDataApp/sdk-js.git
cd sdk-js

# Install dependencies
pnpm install

# Run the test suite (all mocked, no API calls)
pnpm test

# Build the dual CJS+ESM bundle
pnpm build
```

The project uses [Corepack](https://nodejs.org/api/corepack.html) to pin the pnpm version. If `pnpm` is not available, enable Corepack first:

```bash
corepack enable
```

## Core Dependencies

The SDK includes the following core dependencies (installed automatically):

- `dotenv`: Loads environment variables from a `.env` file
- `neverthrow`: Functional `Result` type used internally for error composition. The public API surfaces standard Promises — see [client error handling](./client.md#error-handling).
- `p-limit`: Concurrency pool for fan-out requests
- `p-retry`: Retry logic with exponential backoff
- `zod`: Runtime schema validation and type inference

## Next Steps

After installation, you'll need to:

1. Set up your [authentication token](./authentication.md)
2. Learn about the [client](./client.md) and how to make your first API requests
3. Configure [settings](./settings.md) to customize output format, date format, and other universal parameters
