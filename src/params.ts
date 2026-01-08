import { GLOBAL_EXCLUDED_PARAMS } from "@/internalSettings";
import type { MarketDataSettings } from "@/settings";
import type { MarketDataParams } from "@/types";
import { formatValue } from "@/utils";

const SDK_ONLY_KEYS = [
	...GLOBAL_EXCLUDED_PARAMS,
	"dateFormat",
	"addHeaders",
	"useHumanReadable",
	"mode",
	"columns",
] as const;

const FORMAT_MAP: Record<string, string> = {
	internal: "json",
	dataframe: "json",
};

export function processParams(
	inputParams: MarketDataParams,
	settings: MarketDataSettings,
): MarketDataParams {
	const outputFormat =
		(inputParams.outputFormat as string) ||
		settings.marketdataOutputFormat ||
		"internal";

	const mappedFormat = FORMAT_MAP[outputFormat] || outputFormat;
	const isInternal =
		outputFormat === "internal" || outputFormat === "dataframe";

	const universal: MarketDataParams = {
		format: mappedFormat,
		dateformat: inputParams.dateFormat || settings.marketdataDateFormat,
		headers: inputParams.addHeaders ?? settings.marketdataAddHeaders,
		human: inputParams.useHumanReadable ?? settings.marketdataUseHumanReadable,
		mode: inputParams.mode || settings.marketdataMode,
		columns:
			!isInternal && Array.isArray(inputParams.columns)
				? inputParams.columns.join(",")
				: undefined,
	};

	return Object.fromEntries(
		Object.entries({ ...universal, ...inputParams })
			.filter(
				([key, value]) =>
					!SDK_ONLY_KEYS.includes(key as (typeof SDK_ONLY_KEYS)[number]) &&
					value !== null &&
					value !== undefined,
			)
			.map(([key, value]) => [key, formatValue(value)]),
	) as MarketDataParams;
}
