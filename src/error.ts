export class MarketDataClientError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "MarketDataClientError";
		Error.captureStackTrace?.(this, this.constructor);
	}
}

export class RequestError extends MarketDataClientError {
	constructor(message: string) {
		super(message);
		this.name = "RequestError";
		Error.captureStackTrace?.(this, this.constructor);
	}
}

export class BadStatusCodeError extends MarketDataClientError {
	constructor(message: string) {
		super(message);
		this.name = "BadStatusCodeError";
		Error.captureStackTrace?.(this, this.constructor);
	}
}

export class RateLimitError extends MarketDataClientError {
	constructor(message: string) {
		super(message);
		this.name = "RateLimitError";
		Error.captureStackTrace?.(this, this.constructor);
	}
}

export class MinMaxDateValidationError extends MarketDataClientError {
	constructor(message: string) {
		super(message);
		this.name = "MinMaxDateValidationError";
		Error.captureStackTrace?.(this, this.constructor);
	}
}

export class MarketDataClientErrorResult {
	error: Error;

	constructor(error: Error | string) {
		this.error = typeof error === "string" ? new Error(error) : error;
	}

	toString(): string {
		return `MarketDataClientErrorResult(error=${this.error.name}, message=${this.error.message})`;
	}
}
