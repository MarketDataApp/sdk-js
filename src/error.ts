export class MarketDataClientError extends Error {
	constructor(message: string) {
		super(message);
		this.name = this.constructor.name;
		Error.captureStackTrace?.(this, this.constructor);
	}
}

export class RateLimitError extends MarketDataClientError {}

export class RequestError extends MarketDataClientError {}

export class ValidationError extends MarketDataClientError {}
