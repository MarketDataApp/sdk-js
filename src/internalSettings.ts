export const VALID_STATUS_CODES = [200, 203];
export const GLOBAL_EXCLUDED_PARAMS = ["outputFormat", "filename"] as const;
export const MAX_CONCURRENT_REQUESTS = 50;

export const isRetriableStatusCode = (statusCode: number): boolean =>
	statusCode > 500;

export const REFRESH_API_STATUS_INTERVAL_MS = 4.5 * 60 * 1000;
export const STATUS_FETCH_TIMEOUT_MS = 10000;
