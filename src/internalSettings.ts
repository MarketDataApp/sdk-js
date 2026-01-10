export const Endpoints = {
	API_STATUS: "status/",
	MARKETS_STATUS: "markets/status/",
	FUNDS_CANDLES: "funds/candles/",
	STOCKS_CANDLES: "stocks/candles/",
	STOCKS_PRICES: "stocks/prices/",
	USER: "user/",
} as const;

export const GLOBAL_EXCLUDED_PARAMS = ["outputFormat", "filename"] as const;

export const isRetriableStatusCode = (statusCode: number): boolean =>
	statusCode > 500;

export const MAX_CONCURRENT_REQUESTS = 50;

export const REFRESH_API_STATUS_INTERVAL_MS = 4.5 * 60 * 1000;

export enum Service {
	CANDLES = "/v1/stocks/candles/",
	FUNDS_CANDLES = "/v1/funds/candles/",
	PRICES = "/v1/stocks/prices/",
	STATUS = "/v1/markets/status/",
	USER = "/v1/user/",
}

export const STATUS_FETCH_TIMEOUT_MS = 10000;

export const VALID_STATUS_CODES = [200, 203];
