# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-05-29

**The official Market Data JavaScript / TypeScript SDK is here.** v1.0 is the first stable release — a typed, batteries-included client for the [Market Data API](https://www.marketdata.app/) covering stocks, options, funds, market status, and account utilities. Designed for production use in trading bots, dashboards, research notebooks, and anything else that needs reliable financial data with end-to-end type safety.

### Added

#### Core client

- `MarketDataClient` — single entry point with configurable token, base URL, API version, and logging.
- Demo mode: works without a token against the public sandbox so you can prototype before signing up.
- Eager startup validation: confirms credentials and surfaces rate-limit headroom before your first real call (skippable via `skipStartupValidation`).

#### Stocks

- `stocks.prices()` — real-time and delayed quotes for one or many symbols
- `stocks.candles()` — historical OHLCV with automatic date-range splitting, transparent concurrent fetching, and bar-aggregation across timeframes
- `stocks.quotes()` — bid/ask/last for one or many symbols
- `stocks.news()` — recent news stories per symbol
- `stocks.earnings()` — historical and upcoming earnings reports

#### Options

- `options.chain()` — full options chain with greeks, IV, and liquidity filters
- `options.expirations()` — available expiration dates per underlying
- `options.strikes()` — available strikes per expiration
- `options.quotes()` — quote a single option symbol (with fan-out support for arrays)
- `options.lookup()` — resolve OCC option symbols from human-readable input

#### Funds

- `funds.candles()` — historical OHLCV for mutual funds and ETFs

#### Markets

- `markets.status()` — current open/closed status per market with session details

#### Utilities

- `utilities.status()` — Market Data service health check
- `utilities.headers()` — echo your request headers for debugging

### Type safety and runtime guarantees

- Full TypeScript declarations across every endpoint, parameter, and response shape — autocomplete works out of the box in any modern editor.
- Runtime input and output validation via [Zod](https://zod.dev/) schemas, so malformed API responses surface as typed errors instead of silent corruption.
- Dual ESM and CommonJS builds; same import works for `import` and `require`.

### Reliability

- Automatic retries with exponential backoff (configurable: `maxRetries`, `retryInitialWait`, `retryMaxWait`, `retryFactor`).
- Proactive rate-limit tracking exposed via `client.rateLimits` — see your remaining headroom before you spend it.
- Global concurrency pool prevents accidentally hammering the API from large fan-outs.
- Structured error hierarchy: `MarketDataClientError` → `ValidationError`, `RateLimitError`, `RequestError`, `AuthenticationError`, `NotFoundError`, `ServerError`, `NetworkError`, and more — catch what you mean.
- Optional Result-style error handling via [neverthrow](https://github.com/supermacro/neverthrow) interop for callers who prefer explicit error propagation over `try/catch` (see ADR-007).

### Developer experience

- Multiple output formats per call: typed objects (default), `human`-readable strings, raw JSON, and CSV.
- Chainable `.save(path)` and `.blob()` helpers on every request promise — download to a file or get a Blob without extra plumbing.
- Method overloads: pass a positional symbol string, an array of symbols, or a fully-typed params object — whichever fits the call site.
- Comprehensive examples package under [`examples/`](examples/) covering charting (Lightweight Charts, ECharts, Chart.js, Plotly, Highcharts Stock) and a runnable options-chain monitor.
- Architecture Decision Records (ADR-001 through ADR-007) documenting the design choices behind retries, validation, output formats, error handling, and more.

### Supply chain

- Published from CI via npm Trusted Publishing (OIDC) — no long-lived tokens stored anywhere.
- Cryptographic [provenance attestation](https://docs.npmjs.com/generating-provenance-statements) on every release, linking the published tarball to the exact commit, workflow run, and build environment.

### Engines

- Requires Node.js 20+ (tested on 20.x and 22.x).
- Distributed as both ESM (`dist/index.js`) and CommonJS (`dist/index.cjs`) with matching TypeScript declarations (`dist/index.d.ts`, `dist/index.d.cts`).
