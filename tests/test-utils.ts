import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Result } from "neverthrow";

export interface MockResponseOptions {
	ok?: boolean;
	status?: number;
	json?: any;
	text?: string;
	headers?: Record<string, string>;
}

export function createMockResponse(options: MockResponseOptions = {}): any {
	const {
		ok = true,
		status = 200,
		json = {},
		text = "",
		headers = {},
	} = options;
	return {
		ok,
		status,
		headers: new Headers(headers),
		json: async () => json,
		text: async () => text || JSON.stringify(json),
	};
}

export function loadMock<T = unknown>(name: string): T {
	const path = join(__dirname, "mocks", `${name}.json`);
	return JSON.parse(readFileSync(path, "utf-8")) as T;
}

export function unwrapOk<T, E>(result: Result<T, E>): T {
	if (result.isErr()) {
		throw new Error(
			`Expected Ok, but got Err: ${JSON.stringify(result.error)}`,
		);
	}
	return result.value;
}
