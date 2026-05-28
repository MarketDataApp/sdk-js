# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - Released 2026-05-28

### Added

- Initial stable release of the Market Data JavaScript SDK
- `MarketDataClient` with token, base URL, and API version configuration
- **Stocks resource**
  - `stocks.prices()` — current stock prices for one or many symbols
  - `stocks.candles()` — historical OHLCV data with automatic date-range splitting and concurrent fetching
- **Markets resource**
  - `markets.status()` — current market open/closed status
- Full TypeScript type definitions with autocomplete across all endpoints
- Runtime input/output validation via Zod schemas
- Automatic retry logic with exponential backoff (configurable `maxRetries`, `retryInitialWait`, `retryMaxWait`, `retryFactor`)
- Proactive rate-limit tracking exposed via `client.rateLimits`
- Service status pre-flight checks
- Multiple output formats: typed objects, `human`-readable, raw JSON, and CSV
- Chainable `.save(path)` and `.blob()` helpers on every request promise
- Error hierarchy: `MarketDataClientError`, `ValidationError`, `RateLimitError`, `RequestError`
- Optional Result-style error handling via `neverthrow` interop (see ADR-007)
- Runnable examples package under `examples/` (Lightweight Charts, ECharts, Plotly, Highcharts Stock, Chart.js, options chain monitor)
- Architecture Decision Records (ADR-001 through ADR-007) documenting design choices
