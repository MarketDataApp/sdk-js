export interface ErrorContext {
	request_id?: string;
	status_code?: number;
	request_url?: string;
	timestamp?: Date;
}

const EASTERN_FORMATTER = new Intl.DateTimeFormat("en-US", {
	timeZone: "America/New_York",
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
	hour: "2-digit",
	minute: "2-digit",
	second: "2-digit",
	hour12: false,
	timeZoneName: "short",
});

function formatEastern(d: Date): string {
	const parts = EASTERN_FORMATTER.formatToParts(d);
	const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
	return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}:${get("second")} ${get("timeZoneName")}`;
}

export class MarketDataClientError extends Error {
	public readonly request_id?: string;
	public readonly status_code?: number;
	public readonly request_url?: string;
	public readonly timestamp: Date;

	constructor(message: string, context: ErrorContext = {}) {
		super(message);
		this.name = this.constructor.name;
		this.request_id = context.request_id;
		this.status_code = context.status_code;
		this.request_url = context.request_url;
		this.timestamp = context.timestamp ?? new Date();
		Error.captureStackTrace?.(this, this.constructor);
	}

	public get exception_type(): string {
		return this.name;
	}

	public get support_info(): string {
		const lines = ["[MarketData SDK] Request failed"];
		lines.push(`  Exception:    ${this.exception_type}`);
		lines.push(`  Message:      ${this.message}`);
		if (this.status_code !== undefined)
			lines.push(`  Status Code:  ${this.status_code}`);
		if (this.request_url) lines.push(`  Request URL:  ${this.request_url}`);
		if (this.request_id) lines.push(`  Request ID:   ${this.request_id}`);
		lines.push(`  Timestamp:    ${formatEastern(this.timestamp)}`);
		return lines.join("\n");
	}
}

/** HTTP 401 — token missing, invalid, or expired. */
export class AuthenticationError extends MarketDataClientError {}

/** HTTP 400 — malformed request or invalid parameters rejected by the server. */
export class BadRequestError extends MarketDataClientError {}

/**
 * HTTP 402 — request denied by the user's plan: data older than the plan
 * allows, premium endpoint on Free/Trial, or `mode=cached` on Free/Trial.
 */
export class PaymentRequiredError extends MarketDataClientError {}

/**
 * HTTP 403 — access denied. Typically the multi-IP block: the account is
 * temporarily locked because it was used from more than one IP. Wait ~5
 * minutes and retry.
 */
export class ForbiddenError extends MarketDataClientError {}

/**
 * HTTP 404 — the server has no data matching the query. SDK surfaces this as
 * an empty response with `no_data=true` rather than throwing; the class is
 * still exported for callers who prefer to opt into the throw path.
 */
export class NotFoundError extends MarketDataClientError {}

/** HTTP 429 — per-minute/day rate limit exceeded. */
export class RateLimitError extends MarketDataClientError {}

/**
 * HTTP 5xx — server-side failure. Status codes above 500 are retried with
 * exponential backoff; 500 itself is terminal by design.
 */
export class ServerError extends MarketDataClientError {}

/** Transport-level failure: DNS, connection refused, TLS, or the 99s timeout. */
export class NetworkError extends MarketDataClientError {}

/** Response body failed schema validation or JSON parsing. */
export class ParseError extends MarketDataClientError {}

/**
 * Client-side input validation failure. Thrown before any network I/O, so
 * carries no HTTP metadata. Distinct from `ParseError`, which covers response
 * parsing.
 */
export class ValidationError extends MarketDataClientError {}

/**
 * @deprecated Use `NetworkError` for transport failures or the specific HTTP
 * error classes (`BadRequestError`, `ServerError`, ...). Retained temporarily
 * as an alias; will be removed in a future minor release.
 */
export class RequestError extends NetworkError {}
