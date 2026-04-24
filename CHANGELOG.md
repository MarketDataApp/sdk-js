# Changelog

All notable changes to this project will be documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- **Utilities namespace**: `client.utilities.{status, headers, user}` for service health, header echo, and rate-limit snapshot.
- **Eager `/user/` validation** (ADR-008): the constructor awaits `/user/` so invalid tokens fail fast. Expose a `ready: Promise<void>` field; pass `skipStartupValidation: true` to bypass (serverless cold-start escape hatch).
- **99-second request timeout**: every fetch aborts after 99s with a `NetworkError`.
- **Global 50-request concurrency pool** on the client, shared across all endpoints. Previously `stocks.candles` created a fresh pool per call and `options.quotes` fan-out was unbounded.
- **7-class error hierarchy** with spec-compliant HTTP context metadata (`request_id` from `cf-ray`, `status_code`, `request_url`, `timestamp` in US/Eastern, formatted `support_info`): `AuthenticationError`, `BadRequestError`, `NotFoundError`, `RateLimitError`, `ServerError`, `NetworkError`, `ParseError`. `ValidationError` retained for client-side input validation.
- **Response-model methods** on `MarketDataPromise`: `isJson()`, `isCsv()`, `isHtml()`, `hasData()`, `no_data` getter, `saveToFile()` (alias of `save()`).
- **404 → `no_data`**: 404 responses now resolve with an empty result and `no_data: true` rather than throwing.
- **Environment variables**: `MARKETDATA_COLUMNS` (comma-split to array) and `MARKETDATA_LOGGING_LEVEL` (string → LogLevel).
- **Documentation**: new docs/options.md, docs/funds.md, docs/utilities.md; docs/stocks.md expanded to cover quotes/earnings/news.
- **Examples** under `examples/`: `stock_candles_example` (CSV + lightweight-charts HTML) and `options_chain_monitor` (cli-table3 polling dashboard).
- **Integration test harness** at `tests/integration/*.integration.test.ts`, gated by `MARKETDATA_RUN_INTEGRATION_TESTS=true`; second CI job runs it with the token secret.
- **v8 coverage tooling**: `pnpm test:coverage` + lcov artifact upload in CI.
- **`.env.example`** documenting every supported env var.

### Changed

- **Package name**: `marketdata-sdk-js` → `marketdata-sdk` (matches README imports; previously broken).
- **License**: `package.json` now correctly reports `MIT` (the LICENSE file was already MIT).
- **User-Agent**: `marketdata-js-{v}` → `marketdata-sdk-javascript/{v}` (spec-required format).
- **Public API boundary** (ADR-007): every resource method now returns `MarketDataPromise<T>` (extends `Promise<T>`). Internally `neverthrow` composition remains for `_fetch`/retry/fan-out.
- **Rate-limit init**: lazy `_setupRateLimits` replaced by eager startup validation (ADR-008 supersedes ADR-004).
- **`package.json` hygiene**: fills in `description`, `author`, `repository`, `bugs`, `homepage`, `files` allowlist, `sideEffects: false`, `prepublishOnly` + `typecheck` scripts.

### Deprecated

- `RequestError` class retained as an alias of `NetworkError` for transitional back-compat; will be removed in a future minor release. Use `NetworkError` for transport failures or the specific HTTP error classes (`BadRequestError`, `ServerError`, ...) for HTTP failures.

### Fixed

- Rate-limit TOCTOU over-dispatch and stale-response overwrite (shipped 2026-04-17 pre-release).
- Fan-out methods previously cast to `TypedResult` but never attached `save`/`blob` — the type lie is gone; `save`/`saveToFile`/`blob` work uniformly.

## [0.0.1] - 2026-04-17

Initial scaffold. Internal pre-release; not published to npm.
