# Stocks (JavaScript SDK)

The JavaScript SDK from Market Data provides methods designed to streamline your use of the following Stocks endpoints. These intuitive methods provide a seamless interface, effectively masking the intricacies involved in managing HTTP requests and responses.

## Stocks Endpoints

- [Prices (JavaScript SDK)](./prices.md) — Retrieve the latest price for any supported stock symbol with the JavaScript SDK prices method, in raw or human-readable form.
- [Stock Quotes (JavaScript SDK)](./quotes.md) — Fetch bid, ask, mid, last and volume for one or more stocks with the JavaScript SDK quotes() method, which returns a MarketDataPromise of records.
- [Stock Candles (JavaScript SDK)](./candles.md) — Fetch historical OHLCV stock candles with the JavaScript SDK candles() method, which splits long intraday ranges into chunks fetched concurrently.
- [Earnings (JavaScript SDK)](./earnings.md) — Fetch historical and upcoming earnings for a stock with the JavaScript SDK earnings() method, returned as decoded records, raw JSON or a CSV Blob.
- [News (JavaScript SDK)](./news.md) — Retrieve news articles for any supported stock symbol with the JavaScript SDK news method, in raw or human-readable form.
