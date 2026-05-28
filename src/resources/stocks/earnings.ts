import { errAsync } from "neverthrow";
import { saveBlobToFile } from "@/fileUtils";
import { Endpoints, Service } from "@/internalSettings";
import {
	type StockEarningsHumanResponse,
	StockEarningsHumanSchema,
	type StockEarningsResponse,
	StockEarningsSchema,
} from "@/resources/stocks/outputs";
import {
	type StocksEarningsParams,
	StocksEarningsParamsSchema,
} from "@/resources/stocks/types";
import {
	AlreadyValidatedSchema,
	type MarketDataParams,
	type TypedPromise,
} from "@/types";
import { MarketDataPromise, normalizeArgs } from "@/utils";
import type { StocksResource } from "./index";

export function earnings<
	P extends Omit<StocksEarningsParams, "symbol"> & MarketDataParams,
>(
	this: StocksResource,
	symbol: string,
	params?: P,
): TypedPromise<
	StockEarningsResponse,
	StockEarningsHumanResponse,
	P & { symbol: string }
>;

export function earnings<P extends StocksEarningsParams & MarketDataParams>(
	this: StocksResource,
	params: P,
): TypedPromise<StockEarningsResponse, StockEarningsHumanResponse, P>;

export function earnings(
	this: StocksResource,
	arg1: string | (StocksEarningsParams & MarketDataParams),
	arg2: MarketDataParams = {},
): TypedPromise<
	StockEarningsResponse,
	StockEarningsHumanResponse,
	StocksEarningsParams & MarketDataParams
> {
	const params = normalizeArgs(arg1, arg2, "symbol") as StocksEarningsParams &
		MarketDataParams;

	const validation = this._validateAndNormalize(
		params,
		StocksEarningsParamsSchema,
	);
	if (validation.isErr()) {
		return MarketDataPromise.fromResult(
			errAsync(validation.error),
			saveBlobToFile,
		) as TypedPromise<
			StockEarningsResponse,
			StockEarningsHumanResponse,
			StocksEarningsParams & MarketDataParams
		>;
	}

	const { symbol, ...queryParams } = validation.value;

	this.logger.debug("Fetching stock earnings...");

	return this._fetch(
		`${Endpoints.STOCKS_EARNINGS}${symbol}/`,
		queryParams as MarketDataParams,
		{
			inputSchema: AlreadyValidatedSchema,
			regularSchema: StockEarningsSchema,
			humanSchema: StockEarningsHumanSchema,
			service: Service.EARNINGS,
		},
	) as TypedPromise<
		StockEarningsResponse,
		StockEarningsHumanResponse,
		StocksEarningsParams & MarketDataParams
	>;
}
