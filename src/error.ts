export class MarketDataClientError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "MarketDataClientError";
	}
}

export class RequestError extends MarketDataClientError {
	constructor(message: string) {
		super(message);
		this.name = "RequestError";
	}
}

export class BadStatusCodeError extends MarketDataClientError {
	constructor(message: string) {
		super(message);
		this.name = "BadStatusCodeError";
	}
}

export class RateLimitError extends MarketDataClientError {
	constructor(message: string) {
		super(message);
		this.name = "RateLimitError";
	}
}

export class MinMaxDateValidationError extends MarketDataClientError {
	constructor(message: string) {
		super(message);
		this.name = "MinMaxDateValidationError";
	}
}

export class MarketDataClientErrorResult {
	error: Error;

	constructor(error: Error) {
		this.error = error;
	}

	toString(): string {
		return `MarketDataClientErrorResult(error=${this.error.name}, message=${this.error.message})`;
	}
}
