import dotenv from "dotenv";
import { z } from "zod";
import { DateFormat, Mode, OutputFormat } from "@/enums";
import { LogLevel } from "@/logger";

dotenv.config();

import { BooleanString } from "@/types";

const CommaSeparatedStringArray = z
	.union([z.string(), z.array(z.string())])
	.transform((v) =>
		typeof v === "string"
			? v
					.split(",")
					.map((s) => s.trim())
					.filter(Boolean)
			: v,
	);

const LogLevelFromString = z
	.union([z.nativeEnum(LogLevel), z.string()])
	.transform((v) => {
		if (typeof v === "number") return v;
		const key = v.toUpperCase() as keyof typeof LogLevel;
		if (key in LogLevel) return LogLevel[key];
		throw new Error(`Invalid MARKETDATA_LOGGING_LEVEL: ${v}`);
	});

export const MarketDataSettingsSchema = z.object({
	marketdataAddHeaders: BooleanString.optional(),
	marketdataApiVersion: z.string().default("v1"),
	marketdataBaseUrl: z.string().default("https://api.marketdata.app"),
	marketdataColumns: CommaSeparatedStringArray.optional(),
	marketdataDateFormat: z.enum(DateFormat).optional(),
	marketdataLoggingLevel: LogLevelFromString.optional(),
	marketdataMaxRetries: z.coerce.number().optional().default(3),
	marketdataMode: z.enum(Mode).optional(),
	marketdataOutputFormat: z
		.enum(OutputFormat)
		.optional()
		.default(OutputFormat.INTERNAL),
	marketdataRetryFactor: z.coerce.number().optional().default(2),
	marketdataRetryInitialWait: z.coerce.number().optional().default(0.5),
	marketdataRetryMaxWait: z.coerce.number().optional().default(10),
	marketdataToken: z.string().optional(),
	marketdataUseHumanReadable: BooleanString.optional(),
});

export type MarketDataSettings = z.infer<typeof MarketDataSettingsSchema>;

export const loadSettings = (
	overrides: Partial<MarketDataSettings> = {},
): MarketDataSettings => {
	const envConfig = {
		marketdataAddHeaders: process.env.MARKETDATA_ADD_HEADERS,
		marketdataApiVersion: process.env.MARKETDATA_API_VERSION,
		marketdataBaseUrl: process.env.MARKETDATA_BASE_URL,
		marketdataColumns: process.env.MARKETDATA_COLUMNS,
		marketdataDateFormat: process.env.MARKETDATA_DATE_FORMAT,
		marketdataLoggingLevel: process.env.MARKETDATA_LOGGING_LEVEL,
		marketdataMaxRetries: process.env.MARKETDATA_MAX_RETRIES,
		marketdataMode: process.env.MARKETDATA_MODE,
		marketdataOutputFormat: process.env.MARKETDATA_OUTPUT_FORMAT,
		marketdataRetryFactor: process.env.MARKETDATA_RETRY_FACTOR,
		marketdataRetryInitialWait: process.env.MARKETDATA_RETRY_INITIAL_WAIT,
		marketdataRetryMaxWait: process.env.MARKETDATA_RETRY_MAX_WAIT,
		marketdataToken: process.env.MARKETDATA_TOKEN,
		marketdataUseHumanReadable: process.env.MARKETDATA_USE_HUMAN_READABLE,
	};

	const cleanEnvConfig = Object.fromEntries(
		Object.entries(envConfig).filter(([_, v]) => v !== undefined),
	);

	const cleanOverrides = Object.fromEntries(
		Object.entries(overrides).filter(([_, v]) => v !== undefined),
	);

	const merged = {
		...cleanEnvConfig,
		...cleanOverrides,
	};

	return MarketDataSettingsSchema.parse(merged);
};
