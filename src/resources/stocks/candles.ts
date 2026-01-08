import { errAsync, ResultAsync } from "neverthrow";
import pLimit from "p-limit";
import { MarketDataClientError, RequestError } from "@/error";
import {
	Endpoints,
	MAX_CONCURRENT_REQUESTS,
	Service,
} from "@/internalSettings";
import {
	type StockCandleHumanResponse,
	StockCandleHumanSchema,
	type StockCandleResponse,
	StockCandleSchema,
} from "@/resources/stocks/outputs";
import {
	type StocksCandlesParams,
	StocksCandlesParamsSchema,
} from "@/resources/stocks/types";
import type { MarketDataParams, TypedResult } from "@/types";
import { getDataRecords, normalizeArgs, splitDatesByTimeframe } from "@/utils";
import type { StocksResource } from "./index";

export function candles<
	P extends Omit<StocksCandlesParams, "symbol"> & MarketDataParams,
>(
	this: StocksResource,
	symbol: string,
	params?: P,
): TypedResult<
	StockCandleResponse,
	StockCandleHumanResponse,
	P & { symbol: string }
>;
export function candles<P extends StocksCandlesParams & MarketDataParams>(
	this: StocksResource,
	params: P,
): TypedResult<StockCandleResponse, StockCandleHumanResponse, P>;
export function candles(
	this: StocksResource,
	arg1: string | (StocksCandlesParams & MarketDataParams),
	arg2: MarketDataParams = {},
): TypedResult<
	StockCandleResponse,
	StockCandleHumanResponse,
	StocksCandlesParams & MarketDataParams
> {
	const params = normalizeArgs(arg1, arg2, "symbol") as StocksCandlesParams &
		MarketDataParams;

	const normalization = this._validateAndNormalize(
		params,
		StocksCandlesParamsSchema,
	);
	if (normalization.isErr()) {
		return errAsync(normalization.error) as TypedResult<
			StockCandleResponse,
			StockCandleHumanResponse,
			StocksCandlesParams & MarketDataParams
		>;
	}

	const validated = normalization.value;

	const fromDate = validated.from ? new Date(validated.from) : undefined;
	const toDate = validated.to ? new Date(validated.to) : new Date();

	let ranges: [Date | undefined, Date | undefined][] = [[fromDate, toDate]];
	if (fromDate && isIntraday(validated.resolution as string)) {
		ranges = splitDatesByTimeframe(fromDate, toDate, 365);
	}

	const limit = pLimit(MAX_CONCURRENT_REQUESTS);
	const requests = ranges.map(([start, end]) => {
		const rangeParams = { ...validated, from: start, to: end };
		const { symbol, resolution, ...queryParams } = rangeParams;
		const schema = this._getSchema(
			validated,
			StockCandleSchema,
			StockCandleHumanSchema,
		);

		return ResultAsync.fromPromise(
			limit(() =>
				this._makeRequest<StockCandleResponse | StockCandleHumanResponse>(
					`${Endpoints.STOCKS_CANDLES}${validated.resolution as string}/${validated.symbol}/`,
					queryParams as MarketDataParams,
					{
						schema,
						service: Service.CANDLES,
					},
				),
			),
			(e) =>
				e instanceof MarketDataClientError ? e : new RequestError(String(e)),
		).andThen((res) => res);
	});

	return ResultAsync.combine(requests).map((responses) => {
		const merged = mergeResponses(responses);
		return getDataRecords(merged, ["s"]);
	}) as TypedResult<
		StockCandleResponse,
		StockCandleHumanResponse,
		StocksCandlesParams & MarketDataParams
	>;
}

function isIntraday(resolution: string): boolean {
	return /^(?:[1-9]\d*H|H|minutely|hourly)$/i.test(resolution);
}

function mergeResponses<T extends Record<string, unknown>>(responses: T[]): T {
	if (responses.length === 0) return {} as T;
	if (responses.length === 1) return responses[0];

	const result = { ...responses[0] };

	for (const key of Object.keys(result) as (keyof T)[]) {
		const val = result[key];
		if (Array.isArray(val)) {
			result[key] = responses.flatMap((r) => r[key] as unknown[]) as T[keyof T];
		}
	}

	return result;
}
