import { err, ok, type Result, type ResultAsync } from "neverthrow";
import type { z } from "zod";
import type { MarketDataClientError } from "@/error";
import { ValidationError } from "@/error";

export const formatDate = (date: Date | string | number): string => {
	if (date instanceof Date) {
		return date.toISOString().split("T")[0];
	}
	if (typeof date === "string") {
		const d = new Date(date);
		if (!Number.isNaN(d.getTime()) && date.includes("-")) {
			return d.toISOString().split("T")[0];
		}
		return date;
	}
	if (typeof date === "number") {
		if (date > 0 && date < 60000) {
			const excelBase = new Date(1899, 11, 30);
			const d = new Date(excelBase.getTime() + date * 24 * 60 * 60 * 1000);
			return d.toISOString().split("T")[0];
		}
		const isMs = date > 10000000000;
		return new Date(isMs ? date : date * 1000).toISOString().split("T")[0];
	}
	return String(date);
};

export const formatValue = (value: unknown): string | undefined => {
	if (value === null || value === undefined) return undefined;
	if (value === true || value === false) return String(value).toLowerCase();
	if (value instanceof Date) return formatDate(value);
	if (Array.isArray(value)) return value.map(formatValue).join(",");
	return String(value);
};

export const getDataRecords = <T extends Record<string, unknown>>(
	data: T,
	excludeKeys: readonly string[] = [],
): { [K in keyof T]: Unpacked<T[K]> }[] => {
	const keys = (Object.keys(data) as (keyof T)[]).filter(
		(k) => !excludeKeys.includes(k as string),
	);
	if (keys.length === 0) return [];

	const length = keys.reduce((max, key) => {
		const val = data[key];
		return Array.isArray(val) ? Math.max(max, val.length) : max;
	}, 1);

	return Array.from({ length }, (_, i) => {
		return Object.fromEntries(
			keys.map((key) => {
				const val = data[key];
				return [key, Array.isArray(val) ? val[i] : val];
			}),
		) as { [K in keyof T]: Unpacked<T[K]> };
	});
};

export const normalizeArgs = <T>(
	arg1: unknown,
	arg2: unknown,
	key: keyof T,
): T => {
	if (
		typeof arg1 === "string" ||
		typeof arg1 === "number" ||
		typeof arg1 === "boolean" ||
		Array.isArray(arg1)
	) {
		return { ...(arg2 as object), [key]: arg1 } as T;
	}
	return arg1 as T;
};

export const splitDatesByTimeframe = (
	start: Date,
	end: Date,
	days: number,
): [Date, Date][] => {
	if (start >= end) {
		throw new Error("start must be before end");
	}

	const ranges: [Date, Date][] = [];
	let current = new Date(start);
	const timeframeMs = days * 24 * 60 * 60 * 1000;

	while (true) {
		const nextCut = new Date(current.getTime() + timeframeMs);
		if (nextCut >= end) {
			ranges.push([current, end]);
			break;
		}
		ranges.push([current, nextCut]);
		current = nextCut;
	}

	return ranges;
};

/**
 * Encodes a caller-supplied value for use as a single URL path segment so it
 * cannot smuggle extra segments (`/`, `../`) or truncate the path (`?`, `#`)
 * into the request URL. Valid symbols (alphanumerics, `.`, `-`, `_`) are
 * unchanged by the encoding.
 */
export const encodePathSegment = (segment: unknown): string =>
	encodeURIComponent(String(segment));

export const transformHumanKeys = (
	data: Record<string, unknown>,
): Record<string, unknown> => {
	// Object.fromEntries defines own properties (CreateDataProperty), so a
	// hostile response key like "__proto__" becomes inert data instead of
	// reassigning the result's prototype the way `obj[key] = value` would.
	return Object.fromEntries(
		Object.entries(data).map(([key, value]) => [
			key
				.replace(/ /g, "_")
				.replace(/\$/g, "Price")
				.replace(/%/g, "Percent")
				.replace(/__/g, "_"),
			value,
		]),
	);
};

export const cleanAndValidateParams = <
	T extends z.ZodTypeAny,
	U extends z.ZodTypeAny,
>(
	params: unknown,
	schema: T,
	universalSchema: U,
): Result<z.infer<T> & z.infer<U>, ValidationError> => {
	const result = schema.safeParse(params);
	if (!result.success) {
		return err(new ValidationError(result.error.message));
	}
	const universalResult = universalSchema.safeParse(params);
	if (!universalResult.success) {
		return err(new ValidationError(universalResult.error.message));
	}
	return ok({
		...(result.data as object),
		...(universalResult.data as object),
	} as z.infer<T> & z.infer<U>);
};

export type Unpacked<T> = T extends (infer U)[] ? U : T;

export type UnpackedObject<T> = { [K in keyof T]: Unpacked<T[K]> };

type SaveBlobToFile = (blob: Blob, filename?: string) => Promise<string>;

export type ResponseFormat = "json" | "csv" | "html";

export class MarketDataPromise<T> extends Promise<T> {
	static get [Symbol.species](): PromiseConstructor {
		return Promise;
	}

	private _saveBlobToFile?: SaveBlobToFile;
	private _format: ResponseFormat = "json";
	private _noData = false;

	static fromResult<T>(
		result: ResultAsync<T, MarketDataClientError>,
		saveBlobToFile: SaveBlobToFile,
		meta: {
			format?: ResponseFormat;
			noData?: boolean;
			isNoData?: (value: T) => boolean;
			emptyValue?: T;
		} = {},
	): MarketDataPromise<T> {
		const hasEmptyValue = "emptyValue" in meta;
		let mp!: MarketDataPromise<T>;
		mp = new MarketDataPromise<T>((resolve, reject) => {
			result.match(
				(v) => {
					if (meta.isNoData?.(v)) {
						mp._noData = true;
						resolve(hasEmptyValue ? (meta.emptyValue as T) : v);
					} else {
						resolve(v);
					}
				},
				(e) => reject(e),
			);
		});
		mp._saveBlobToFile = saveBlobToFile;
		mp._format = meta.format ?? "json";
		mp._noData = meta.noData ?? false;
		return mp;
	}

	/** True when the request asked for (or defaulted to) JSON output. */
	public isJson(): boolean {
		return this._format === "json";
	}

	/** True when the request asked for CSV output and the resolved value is a Blob. */
	public isCsv(): boolean {
		return this._format === "csv";
	}

	/** True when the resolved value is an HTML blob (reserved for future use). */
	public isHtml(): boolean {
		return this._format === "html";
	}

	/** True when the server returned 404, translated to an empty result. */
	public get no_data(): boolean {
		return this._noData;
	}

	/**
	 * Resolves to whether the response actually carries data. Awaits the
	 * underlying value; returns false for 404-translated empties or any
	 * empty array / Blob of zero length.
	 */
	public async hasData(): Promise<boolean> {
		if (this._noData) return false;
		const value = await this;
		if (value instanceof Blob) return value.size > 0;
		if (Array.isArray(value)) return value.length > 0;
		return value != null;
	}

	async blob(): Promise<Blob> {
		const value = await this;
		if (value instanceof Blob) return value;
		return new Blob([JSON.stringify(value)], { type: "application/json" });
	}

	async save(filename?: string): Promise<string> {
		if (!this._saveBlobToFile) {
			throw new Error("MarketDataPromise.save() requires saveBlobToFile");
		}
		const blob = await this.blob();
		return this._saveBlobToFile(blob, filename);
	}

	/** Alias for `save()` to match the SDK requirements §8 spec naming. */
	saveToFile(filename?: string): Promise<string> {
		return this.save(filename);
	}
}

export function formatDurationLog(durationMs: number): string {
	if (durationMs < 1000) {
		return `${Math.floor(durationMs).toString().padStart(3, "0")}ms`;
	}
	if (durationMs < 10000) {
		return `${(durationMs / 1000).toFixed(2)}s`;
	}
	if (durationMs < 100000) {
		return `${(durationMs / 1000).toFixed(1).padStart(4, "0")}s`;
	}
	return `${(durationMs / 1000).toFixed(0).padStart(5, " ")}s`;
}
