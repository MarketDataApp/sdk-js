import { errAsync } from "neverthrow";
import { saveBlobToFile } from "@/fileUtils";
import { Endpoints, Service } from "@/internalSettings";
import {
	type FundsCandleHumanResponse,
	FundsCandleHumanSchema,
	type FundsCandleResponse,
	FundsCandleSchema,
} from "@/resources/funds/outputs";
import {
	type FundsCandlesParams,
	FundsCandlesParamsSchema,
} from "@/resources/funds/types";
import {
	AlreadyValidatedSchema,
	type MarketDataParams,
	type TypedPromise,
} from "@/types";
import { encodePathSegment, MarketDataPromise, normalizeArgs } from "@/utils";
import type { FundsResource } from "./index";

export function candles<
	P extends Omit<FundsCandlesParams, "symbol"> & MarketDataParams,
>(
	this: FundsResource,
	symbol: string,
	params?: P,
): TypedPromise<
	FundsCandleResponse,
	FundsCandleHumanResponse,
	P & { symbol: string }
>;
export function candles<P extends FundsCandlesParams & MarketDataParams>(
	this: FundsResource,
	params: P,
): TypedPromise<FundsCandleResponse, FundsCandleHumanResponse, P>;
export function candles(
	this: FundsResource,
	arg1: string | (FundsCandlesParams & MarketDataParams),
	arg2: MarketDataParams = {},
): TypedPromise<
	FundsCandleResponse,
	FundsCandleHumanResponse,
	FundsCandlesParams & MarketDataParams
> {
	const params = normalizeArgs(arg1, arg2, "symbol") as FundsCandlesParams &
		MarketDataParams;

	const validation = this._validateAndNormalize(
		params,
		FundsCandlesParamsSchema,
	);
	if (validation.isErr()) {
		return MarketDataPromise.fromResult(
			errAsync(validation.error),
			saveBlobToFile,
		) as TypedPromise<
			FundsCandleResponse,
			FundsCandleHumanResponse,
			FundsCandlesParams & MarketDataParams
		>;
	}

	// `resolution` is guaranteed defined here — the schema's .default("D")
	// runs during validation and the regex check has already passed.
	const { symbol, resolution, ...queryParams } = validation.value;

	this.logger.debug("Fetching fund candles...");

	return this._fetch(
		`${Endpoints.FUNDS_CANDLES}${encodePathSegment(resolution)}/${encodePathSegment(symbol)}/`,
		queryParams as MarketDataParams,
		{
			inputSchema: AlreadyValidatedSchema,
			regularSchema: FundsCandleSchema,
			humanSchema: FundsCandleHumanSchema,
			service: Service.FUNDS_CANDLES,
		},
	);
}
