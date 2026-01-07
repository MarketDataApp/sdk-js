import type { MarketDataSettings } from "@/settings";
import type { MarketDataParams, UserUniversalAPIParams } from "@/types";

export function processParams(
	inputParams: MarketDataParams,
	userUniversalParams: Partial<UserUniversalAPIParams>,
	settings: MarketDataSettings,
): MarketDataParams {
	const params: MarketDataParams = {};

	const universal = {
		format: userUniversalParams.outputFormat || settings.marketdataOutputFormat,
		dateformat: userUniversalParams.dateFormat || settings.marketdataDateFormat,
		headers: userUniversalParams.addHeaders ?? settings.marketdataAddHeaders,
		human:
			userUniversalParams.useHumanReadable ??
			settings.marketdataUseHumanReadable,
		mode: userUniversalParams.mode || settings.marketdataMode,
		columns: userUniversalParams.columns,
	};

	for (const [key, value] of Object.entries(universal)) {
		if (value !== undefined && value !== null) {
			params[key] = value;
		}
	}

	for (const [key, value] of Object.entries(inputParams)) {
		if (value !== undefined && value !== null) {
			params[key] = value;
		}
	}

	return params;
}
