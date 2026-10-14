import dotenv from "dotenv";
import { z } from "zod";
import { DateFormat, Mode, OutputFormat } from "@/enums";
import { LogLevel } from "@/logger";
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
	// Parse .env privately instead of injecting it into process.env. The SDK's
	// convention is to load only its own MARKETDATA_* variables; a consumer's
	// unrelated .env entries (database URLs, cloud credentials, ...) must never
	// leak into the process environment as an import side effect. Real
	// environment variables take precedence over .env values, matching
	// dotenv's own no-override behavior.
	const dotenvVars: Record<string, string> =
		dotenv.config({ processEnv: {}, quiet: true }).parsed ?? {};
	const env = (key: string): string | undefined =>
		process.env[key] ?? dotenvVars[key];

	const envConfig = {
		marketdataAddHeaders: env("MARKETDATA_ADD_HEADERS"),
		marketdataApiVersion: env("MARKETDATA_API_VERSION"),
		marketdataBaseUrl: env("MARKETDATA_BASE_URL"),
		marketdataColumns: env("MARKETDATA_COLUMNS"),
		marketdataDateFormat: env("MARKETDATA_DATE_FORMAT"),
		marketdataLoggingLevel: env("MARKETDATA_LOGGING_LEVEL"),
		marketdataMaxRetries: env("MARKETDATA_MAX_RETRIES"),
		marketdataMode: env("MARKETDATA_MODE"),
		marketdataOutputFormat: env("MARKETDATA_OUTPUT_FORMAT"),
		marketdataRetryFactor: env("MARKETDATA_RETRY_FACTOR"),
		marketdataRetryInitialWait: env("MARKETDATA_RETRY_INITIAL_WAIT"),
		marketdataRetryMaxWait: env("MARKETDATA_RETRY_MAX_WAIT"),
		marketdataToken: env("MARKETDATA_TOKEN"),
		marketdataUseHumanReadable: env("MARKETDATA_USE_HUMAN_READABLE"),
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
