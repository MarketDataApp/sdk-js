import pLimit from "p-limit";
import { MAX_CONCURRENT_REQUESTS } from "@/internalSettings";
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

export async function candles<
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
export async function candles<P extends StocksCandlesParams & MarketDataParams>(
	this: StocksResource,
	params: P,
): TypedResult<StockCandleResponse, StockCandleHumanResponse, P>;
export async function candles(
	this: StocksResource,
	arg1: string | (StocksCandlesParams & MarketDataParams),
	arg2: MarketDataParams = {},
): Promise<unknown> {
	const params = normalizeArgs(arg1, arg2, "symbol") as StocksCandlesParams &
		MarketDataParams;
	return this._run(async () => {
		const validated = StocksCandlesParamsSchema.parse(params);

		const fromDate = validated.from ? new Date(validated.from) : undefined;
		const toDate = validated.to ? new Date(validated.to) : new Date();

		let ranges: [Date | undefined, Date | undefined][] = [[fromDate, toDate]];
		if (fromDate && isIntraday(validated.resolution)) {
			ranges = splitDatesByTimeframe(fromDate, toDate, 365);
		}

		const fetchRange = async (start?: Date, end?: Date) => {
			const rangeParams = { ...validated, from: start, to: end };
			const { symbol, resolution, ...queryParams } = rangeParams;
			const schema = this._getSchema(
				validated,
				StockCandleSchema,
				StockCandleHumanSchema,
			);

			return this._makeRequest<StockCandleResponse | StockCandleHumanResponse>(
				`stocks/candles/${validated.resolution}/${validated.symbol}/`,
				queryParams as MarketDataParams,
				{
					schema,
					service: "/v1/stocks/candles/",
				},
			);
		};

		const limit = pLimit(MAX_CONCURRENT_REQUESTS);
		const responses = await Promise.all(
			ranges.map(([start, end]) => limit(() => fetchRange(start, end))),
		);

		const merged = mergeResponses(responses);
		return getDataRecords(merged, ["s"]);
	});
}

function isIntraday(resolution: string): boolean {
	return /^(?:[1-9]\d*H|H|minutely|hourly)$/i.test(resolution);
}

function mergeResponses<T extends Record<string, unknown>>(responses: T[]): T {
	if (responses.length === 0) return {} as T;
	if (responses.length === 1) return responses[0];

	const result = { ...responses[0] };
	const keys = Object.keys(responses[0]);

	for (const key of keys) {
		if (Array.isArray(responses[0][key])) {
			result[key as keyof T] = responses.flatMap(
				(r) => r[key] as unknown[],
			) as unknown as T[keyof T];
		}
	}

	return result;
}
