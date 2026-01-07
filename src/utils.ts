export type Unpacked<T> = T extends (infer U)[] ? U : T;

export type stockRequestResult<T> = { [K in keyof T]: Unpacked<T[K]> }[];

export const getDataRecords = <T extends Record<string, any>>(
	data: T,
): { [K in keyof T]: Unpacked<T[K]> }[] => {
	const keys = Object.keys(data) as (keyof T)[];
	if (keys.length === 0) return [];

	const length = Object.values(data).reduce((max, val) => {
		if (Array.isArray(val)) return Math.max(max, val.length);
		return max;
	}, 1);

	return Array.from({ length }, (_, i) => {
		const row = {} as { [K in keyof T]: Unpacked<T[K]> };
		for (const key of keys) {
			const val = data[key];
			(row as any)[key] = Array.isArray(val) ? val[i] : val;
		}
		return row;
	});
};
