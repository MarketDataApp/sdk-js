export class MarketDataClientError extends Error {
	constructor(message: string) {
		super(message);
		this.name = this.constructor.name;
		Error.captureStackTrace?.(this, this.constructor);
	}
}

export class BadStatusCodeError extends MarketDataClientError {}
export class MinMaxDateValidationError extends MarketDataClientError {}
export class RateLimitError extends MarketDataClientError {}
export class RequestError extends MarketDataClientError {}

export class MarketDataClientErrorResult {
	public readonly error: Error;

	constructor(error: Error | string) {
		this.error = typeof error === "string" ? new Error(error) : error;
	}

	public static isError(
		result: unknown,
	): result is MarketDataClientErrorResult {
		return result instanceof MarketDataClientErrorResult;
	}

	public toString(): string {
		return `MarketDataClientErrorResult(error=${this.error.name}, message="${this.error.message}")`;
	}
}
