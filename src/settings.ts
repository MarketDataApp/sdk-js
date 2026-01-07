import dotenv from "dotenv";
import { z } from "zod";
import { DateFormat, Mode, OutputFormat } from "./enums";

dotenv.config();

const BooleanString = z.union([z.boolean(), z.string()]).transform((val) => {
	if (typeof val === "boolean") return val;
	return val.toLowerCase() === "true" || val === "1";
});

export const MarketDataSettingsSchema = z.object({
	marketdataToken: z.string().optional(),
	marketdataBaseUrl: z.string().default("https://api.marketdata.app"),
	marketdataApiVersion: z.string().default("v1"),

	marketdataOutputFormat: z
		.nativeEnum(OutputFormat)
		.optional()
		.default(OutputFormat.JSON),
	marketdataDateFormat: z.nativeEnum(DateFormat).optional(),
	marketdataColumns: z.array(z.string()).optional(),
	marketdataAddHeaders: BooleanString.optional(),
	marketdataUseHumanReadable: BooleanString.optional(),
	marketdataMode: z.nativeEnum(Mode).optional(),
	marketdataMaxRetries: z.coerce.number().optional().default(3),
	marketdataRetryInitialWait: z.coerce.number().optional().default(0.5),
	marketdataRetryFactor: z.coerce.number().optional().default(2),
	marketdataRetryMaxWait: z.coerce.number().optional().default(10),
});

export type MarketDataSettings = z.infer<typeof MarketDataSettingsSchema>;

export const loadSettings = (
	overrides: Partial<MarketDataSettings> = {},
): MarketDataSettings => {
	const envConfig = {
		marketdataToken: process.env.MARKETDATA_TOKEN,
		marketdataBaseUrl: process.env.MARKETDATA_BASE_URL,
		marketdataApiVersion: process.env.MARKETDATA_API_VERSION,
		marketdataOutputFormat: process.env.MARKETDATA_OUTPUT_FORMAT,
		marketdataDateFormat: process.env.MARKETDATA_DATE_FORMAT,
		marketdataAddHeaders: process.env.MARKETDATA_ADD_HEADERS,
		marketdataUseHumanReadable: process.env.MARKETDATA_USE_HUMAN_READABLE,
		marketdataMode: process.env.MARKETDATA_MODE,
		marketdataMaxRetries: process.env.MARKETDATA_MAX_RETRIES,
		marketdataRetryInitialWait: process.env.MARKETDATA_RETRY_INITIAL_WAIT,
		marketdataRetryFactor: process.env.MARKETDATA_RETRY_FACTOR,
		marketdataRetryMaxWait: process.env.MARKETDATA_RETRY_MAX_WAIT,
	};

	const cleanEnvConfig = Object.fromEntries(
		Object.entries(envConfig).filter(([_, v]) => v !== undefined),
	);

	const merged = {
		...cleanEnvConfig,
		...overrides,
	};

	return MarketDataSettingsSchema.parse(merged);
};
