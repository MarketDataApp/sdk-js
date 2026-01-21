import { err, ok, type Result, type ResultAsync } from "neverthrow";
import type { z } from "zod";
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

export const transformHumanKeys = (
	data: Record<string, unknown>,
): Record<string, unknown> => {
	const transformed: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(data)) {
		const newKey = key
			.replace(/ /g, "_")
			.replace(/\$/g, "Price")
			.replace(/%/g, "Percent")
			.replace(/__/g, "_");
		transformed[newKey] = value;
	}
	return transformed;
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

import type { MarketDataResult } from "@/types";

export function attachMarketDataMethods<T>(
	result: ResultAsync<T, unknown>,
	saveBlobToFile: (blob: Blob, filename?: string) => Promise<string>,
): MarketDataResult<T> {
	const r = result as unknown as MarketDataResult<T>;
	r.blob = async function (this: ResultAsync<T, unknown>): Promise<Blob> {
		const res = await this;
		if (res.isOk()) {
			const val = res.value;
			if (val instanceof Blob) {
				return val;
			}
			return new Blob([JSON.stringify(val)], {
				type: "application/json",
			});
		}
		throw res.error;
	};

	r.save = async function (
		this: Record<string, unknown>,
		filename?: string,
	): Promise<string> {
		const blob = await (this.blob as () => Promise<Blob>)();
		return saveBlobToFile(blob, filename);
	};

	return r;
}
