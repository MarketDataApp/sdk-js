export const MAX_CONCURRENT_REQUESTS = 50;
export const HTTP_TIMEOUT_MS = 60000;
export const MIN_RETRY_BACKOFF_MS = 500;
export const MAX_RETRY_BACKOFF_MS = 5000;
export const VALID_STATUS_CODES = [200, 203];
export const GLOBAL_EXCLUDED_PARAMS = ["outputFormat", "filename"] as const;
export const ALLOWED_POSITIONAL_PARAMS = [
	"symbol",
	"symbols",
	"lookup",
] as const;

export const isRetriableStatusCode = (statusCode: number): boolean =>
	statusCode > 500;
