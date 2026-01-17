export const CHECK_RATE_LIMITS = true;

export const Endpoints = {
	API_STATUS: "status/",
	FUNDS_CANDLES: "funds/candles/",
	MARKETS_STATUS: "markets/status/",
	OPTIONS_CHAIN: "options/chain/",
	OPTIONS_EXPIRATIONS: "options/expirations/",
	OPTIONS_LOOKUP: "options/lookup/",
	OPTIONS_QUOTES: "options/quotes/",
	OPTIONS_STRIKES: "options/strikes/",
	STOCKS_CANDLES: "stocks/candles/",
	STOCKS_EARNINGS: "stocks/earnings/",
	STOCKS_PRICES: "stocks/prices/",
	USER: "user/",
} as const;

export const GLOBAL_EXCLUDED_PARAMS = ["outputFormat", "filename"] as const;

export const DEFAULT_EXCLUDE_KEYS = ["s"] as const;

export const isRetriableStatusCode = (statusCode: number): boolean =>
	statusCode > 500;

export const MAX_CONCURRENT_REQUESTS = 50;

export const REFRESH_API_STATUS_INTERVAL_MS = 4.5 * 60 * 1000;

export const Service = {
	CANDLES: `/v1/${Endpoints.STOCKS_CANDLES}`,
	EARNINGS: `/v1/${Endpoints.STOCKS_EARNINGS}`,
	FUNDS_CANDLES: `/v1/${Endpoints.FUNDS_CANDLES}`,
	OPTIONS_CHAIN: `/v1/${Endpoints.OPTIONS_CHAIN}`,
	OPTIONS_EXPIRATIONS: `/v1/${Endpoints.OPTIONS_EXPIRATIONS}`,
	OPTIONS_LOOKUP: `/v1/${Endpoints.OPTIONS_LOOKUP}`,
	OPTIONS_QUOTES: `/v1/${Endpoints.OPTIONS_QUOTES}`,
	OPTIONS_STRIKES: `/v1/${Endpoints.OPTIONS_STRIKES}`,
	PRICES: `/v1/${Endpoints.STOCKS_PRICES}`,
	STATUS: `/v1/${Endpoints.MARKETS_STATUS}`,
	USER: `/v1/${Endpoints.USER}`,
} as const;

export type Service = (typeof Service)[keyof typeof Service];

export const STATUS_FETCH_TIMEOUT_MS = 10000;

export const VALID_STATUS_CODES = [200, 203];
