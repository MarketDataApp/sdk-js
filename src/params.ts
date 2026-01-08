import { GLOBAL_EXCLUDED_PARAMS } from "@/internalSettings";
import type { MarketDataSettings } from "@/settings";
import type { MarketDataParams, UserUniversalAPIParams } from "@/types";

const SDK_ONLY_KEYS = [
	...GLOBAL_EXCLUDED_PARAMS,
	"dateFormat",
	"addHeaders",
	"useHumanReadable",
	"mode",
	"columns",
] as const;

function getApiFormat(outputFormat: string | undefined): string | undefined {
	if (outputFormat === "internal" || outputFormat === "dataframe") {
		return "json";
	}
	return outputFormat;
}

const isDefined = (value: unknown): boolean => value != null;

export function processParams(
	inputParams: MarketDataParams,
	userUniversalParams: Partial<UserUniversalAPIParams>,
	settings: MarketDataSettings,
): MarketDataParams {
	const outputFormat =
		userUniversalParams.outputFormat || settings.marketdataOutputFormat;

	const universal: MarketDataParams = {
		format: getApiFormat(outputFormat),
		dateformat: userUniversalParams.dateFormat || settings.marketdataDateFormat,
		headers: userUniversalParams.addHeaders ?? settings.marketdataAddHeaders,
		human:
			userUniversalParams.useHumanReadable ??
			settings.marketdataUseHumanReadable,
		mode: userUniversalParams.mode || settings.marketdataMode,
		columns:
			userUniversalParams.columns && Array.isArray(userUniversalParams.columns)
				? userUniversalParams.columns
				: undefined,
	};

	const filteredInput = Object.fromEntries(
		Object.entries(inputParams).filter(
			([key, value]) =>
				!SDK_ONLY_KEYS.includes(key as (typeof SDK_ONLY_KEYS)[number]) &&
				isDefined(value),
		),
	);

	return Object.fromEntries(
		Object.entries({ ...universal, ...filteredInput }).filter(([_, v]) =>
			isDefined(v),
		),
	) as MarketDataParams;
}
