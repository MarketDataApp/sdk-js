import { errAsync, okAsync, ResultAsync } from "neverthrow";
import { ValidationError } from "@/error";
import { saveBlobToFile } from "@/fileUtils";
import { Endpoints, Service } from "@/internalSettings";
import { isNoData } from "@/resources/base";
import {
	type OptionsQuotesHumanResponse,
	OptionsQuotesHumanSchema,
	type OptionsQuotesResponse,
	OptionsQuotesSchema,
} from "@/resources/options/outputs";

import type { OptionsQuotesParams } from "@/resources/options/types";
import type { MarketDataParams, TypedPromise } from "@/types";
import {
	getDataRecords,
	MarketDataPromise,
	normalizeArgs,
	transformHumanKeys,
} from "@/utils";
import type { OptionsResource } from "./index";

export function quotes<
	P extends Omit<OptionsQuotesParams, "symbols"> & MarketDataParams,
>(
	this: OptionsResource,
	symbols: string | string[],
	params?: P,
): TypedPromise<
	OptionsQuotesResponse,
	OptionsQuotesHumanResponse,
	P & { symbols: string | string[] }
>;
export function quotes<P extends OptionsQuotesParams & MarketDataParams>(
	this: OptionsResource,
	params: P,
): TypedPromise<OptionsQuotesResponse, OptionsQuotesHumanResponse, P>;
export function quotes(
	this: OptionsResource,
	arg1: string | string[] | (OptionsQuotesParams & MarketDataParams),
	arg2: MarketDataParams = {},
): TypedPromise<
	OptionsQuotesResponse,
	OptionsQuotesHumanResponse,
	OptionsQuotesParams & MarketDataParams
> {
	const params = normalizeArgs(arg1, arg2, "symbols") as OptionsQuotesParams &
		MarketDataParams;

	const useHuman =
		params.human ||
		params.useHumanReadable ||
		this.client.settings.marketdataUseHumanReadable;

	const symbols = Array.isArray(params.symbols)
		? params.symbols
		: typeof params.symbols === "string"
			? params.symbols.split(",")
			: [];

	this.logger.debug("Fetching options quotes...");

	let sentinelCount = 0;
	const requests = symbols.map((symbol) => {
		return this._makeRequest<Record<string, unknown>>(
			`${Endpoints.OPTIONS_QUOTES}${symbol}/`,
			params,
			{
				service: Service.OPTIONS_QUOTES,
			},
		).andThen((data) => {
			if (isNoData(data)) {
				sentinelCount++;
				return okAsync([] as unknown as ReturnType<typeof getDataRecords>);
			}
			const finalData = useHuman ? transformHumanKeys(data) : data;
			const schema = useHuman ? OptionsQuotesHumanSchema : OptionsQuotesSchema;
			const result = schema.safeParse(finalData);

			if (!result.success) {
				return errAsync(
					new ValidationError(JSON.stringify(result.error.issues)),
				);
			}

			return okAsync(getDataRecords(result.data, ["s"]));
		});
	});

	return MarketDataPromise.fromResult(
		ResultAsync.combine(requests).map((results) => {
			return results.flat() as OptionsQuotesResponse &
				OptionsQuotesHumanResponse;
		}),
		saveBlobToFile,
		{
			isNoData: () => symbols.length > 0 && sentinelCount === symbols.length,
			emptyValue: [] as unknown as OptionsQuotesResponse &
				OptionsQuotesHumanResponse,
		},
	) as unknown as TypedPromise<
		OptionsQuotesResponse,
		OptionsQuotesHumanResponse,
		OptionsQuotesParams & MarketDataParams
	>;
}
