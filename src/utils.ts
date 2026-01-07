export type Unpacked<T> = T extends (infer U)[] ? U : T;

export type stockRequestResult<T> = { [K in keyof T]: Unpacked<T[K]> }[];

export const getDataRecords = <T extends Record<string, unknown>>(
	data: T,
	excludeKeys: string[] = [],
): stockRequestResult<T> => {
	const keys = Object.keys(data).filter(
		(k) => !excludeKeys.includes(k),
	) as (keyof T)[];
	if (keys.length === 0) return [];

	const length = Object.values(data).reduce((max: number, val) => {
		if (Array.isArray(val)) return Math.max(max, val.length);
		return max;
	}, 1);

	return Array.from({ length }, (_, i) => {
		const row = {} as { [K in keyof T]: Unpacked<T[K]> };
		for (const key of keys) {
			const val = data[key];
			row[key] = (Array.isArray(val) ? val[i] : val) as Unpacked<T[keyof T]>;
		}
		return row;
	});
};
