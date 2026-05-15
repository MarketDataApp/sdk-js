import { errAsync, okAsync, ResultAsync } from "neverthrow";
import { MarketDataClientError, NetworkError } from "@/error";
import { saveBlobToFile } from "@/fileUtils";
import { Endpoints, Service } from "@/internalSettings";
import { isNoData } from "@/resources/base";
import {
	type StockCandleHumanRawResponse,
	type StockCandleHumanResponse,
	StockCandleHumanSchema,
	type StockCandleRawResponse,
	type StockCandleResponse,
	StockCandleSchema,
} from "@/resources/stocks/outputs";

import {
	type StocksCandlesParams,
	StocksCandlesParamsSchema,
} from "@/resources/stocks/types";
import type { MarketDataParams, TypedPromise } from "@/types";

import {
	getDataRecords,
	MarketDataPromise,
	normalizeArgs,
	splitDatesByTimeframe,
} from "@/utils";
import type { StocksResource } from "./index";

export function candles<
	P extends Omit<StocksCandlesParams, "symbol"> & MarketDataParams,
>(
	this: StocksResource,
	symbol: string,
	params?: P,
): TypedPromise<
	StockCandleResponse,
	StockCandleHumanResponse,
	P & { symbol: string }
>;

export function candles<P extends StocksCandlesParams & MarketDataParams>(
	this: StocksResource,
	params: P,
): TypedPromise<StockCandleResponse, StockCandleHumanResponse, P>;

export function candles(
	this: StocksResource,
	arg1: string | (StocksCandlesParams & MarketDataParams),
	arg2: MarketDataParams = {},
): TypedPromise<
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
		return MarketDataPromise.fromResult(
			errAsync(normalization.error),
			saveBlobToFile,
		) as TypedPromise<
			StockCandleResponse,
			StockCandleHumanResponse,
			StocksCandlesParams & MarketDataParams
		>;
	}

	const validated = normalization.value;

	const fromDate = validated.from ? new Date(validated.from) : undefined;
	const toDate = validated.to ? new Date(validated.to) : new Date();

	const ranges: [Date | undefined, Date | undefined][] =
		fromDate && isIntraday(validated.resolution as string)
			? splitDatesByTimeframe(fromDate, toDate, 365)
			: [[fromDate, toDate]];

	this.logger.debug("Fetching stock candles...");

	const useHuman =
		validated.human ||
		validated.useHumanReadable ||
		this.client.settings.marketdataUseHumanReadable;
	const isHuman = useHuman === true || useHuman === "true" || useHuman === "1";

	const schema = this._getSchema(
		validated,
		StockCandleSchema,
		StockCandleHumanSchema,
	);

	let sentinelCount = 0;
	const requests = ranges.map(([start, end]) => {
		const rangeParams = { ...validated, from: start, to: end };
		const { symbol, resolution, ...queryParams } = rangeParams;

		return ResultAsync.fromPromise(
			Promise.resolve(
				this._makeRequest<StockCandleRawResponse | StockCandleHumanRawResponse>(
					`${Endpoints.STOCKS_CANDLES}${validated.resolution as string}/${validated.symbol}/`,

					queryParams as MarketDataParams,
					{
						schema,
						service: Service.CANDLES,
					},
				),
			),
			(e) =>
				e instanceof MarketDataClientError ? e : new NetworkError(String(e)),
		)
			.andThen((res) => res)
			.andThen((res) => {
				if (isNoData(res)) {
					sentinelCount++;
					return okAsync(emptyCandleResponse(isHuman));
				}
				return okAsync(res);
			});
	});

	return MarketDataPromise.fromResult(
		ResultAsync.combine(requests).map((responses) => {
			const merged = mergeResponses(responses);
			return getDataRecords(merged, ["s"]);
		}),
		saveBlobToFile,
		{
			isNoData: () => ranges.length > 0 && sentinelCount === ranges.length,
			emptyValue: [] as unknown as StockCandleResponse &
				StockCandleHumanResponse,
		},
	) as TypedPromise<
		StockCandleResponse,
		StockCandleHumanResponse,
		StocksCandlesParams & MarketDataParams
	>;
}

function emptyCandleResponse(
	isHuman: boolean,
): StockCandleRawResponse | StockCandleHumanRawResponse {
	if (isHuman) {
		return {
			s: "no_data",
			Date: [],
			Open: [],
			High: [],
			Low: [],
			Close: [],
			Volume: [],
		} as StockCandleHumanRawResponse;
	}
	return {
		s: "no_data",
		t: [],
		o: [],
		h: [],
		l: [],
		c: [],
		v: [],
	} as StockCandleRawResponse;
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
