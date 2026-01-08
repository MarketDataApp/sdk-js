export const getDataRecords = <T extends Record<string, unknown>>(
	data: T,
	excludeKeys: string[] = [],
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
		const row = {} as { [K in keyof T]: Unpacked<T[K]> };
		for (const key of keys) {
			const val = data[key];
			row[key] = (Array.isArray(val) ? val[i] : val) as Unpacked<T[keyof T]>;
		}
		return row;
	});
};

export type stockRequestResult<T> = { [K in keyof T]: Unpacked<T[K]> }[];

export type Unpacked<T> = T extends (infer U)[] ? U : T;
