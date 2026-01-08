export const getDataRecords = <T extends Record<string, unknown>>(
	data: T,
	excludeKeys: readonly string[] = [],
): stockRequestResult<T> => {
	const keys = (Object.keys(data) as (keyof T)[]).filter(
		(k) => !excludeKeys.includes(k as string),
	);
	if (keys.length === 0) return [];

	const length = Object.values(data).reduce(
		(max: number, val) =>
			Array.isArray(val) ? Math.max(max, val.length) : max,
		1,
	);

	return Array.from({ length }, (_, i) => {
		return Object.fromEntries(
			keys.map((key) => {
				const val = data[key];
				return [key, Array.isArray(val) ? val[i] : val];
			}),
		) as { [K in keyof T]: Unpacked<T[K]> };
	});
};

export type stockRequestResult<T> = { [K in keyof T]: Unpacked<T[K]> }[];

export type Unpacked<T> = T extends (infer U)[] ? U : T;
