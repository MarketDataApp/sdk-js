import { GLOBAL_EXCLUDED_PARAMS } from "@/internalSettings";
import type { MarketDataSettings } from "@/settings";
import type {
	MarketDataParam,
	MarketDataParams,
	UserUniversalAPIParams,
} from "@/types";

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
	const params: MarketDataParams = {};

	const outputFormat =
		userUniversalParams.outputFormat || settings.marketdataOutputFormat;

	const universal: Record<string, MarketDataParam> = {
		format: getApiFormat(outputFormat),
		dateformat: userUniversalParams.dateFormat || settings.marketdataDateFormat,
		headers: userUniversalParams.addHeaders ?? settings.marketdataAddHeaders,
		human:
			userUniversalParams.useHumanReadable ??
			settings.marketdataUseHumanReadable,
		mode: userUniversalParams.mode || settings.marketdataMode,
	};

	if (
		userUniversalParams.columns &&
		Array.isArray(userUniversalParams.columns)
	) {
		universal.columns = userUniversalParams.columns;
	}

	for (const [key, value] of Object.entries(universal)) {
		if (isDefined(value)) {
			params[key] = value;
		}
	}

	for (const [key, value] of Object.entries(inputParams)) {
		if (SDK_ONLY_KEYS.includes(key as (typeof SDK_ONLY_KEYS)[number])) {
			continue;
		}
		if (isDefined(value)) {
			params[key] = value;
		}
	}

	return params;
}
