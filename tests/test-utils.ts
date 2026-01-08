import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface MockResponseOptions {
    ok?: boolean;
    status?: number;
    json?: any;
    text?: string;
    headers?: Record<string, string>;
}

export function createMockResponse(options: MockResponseOptions = {}): any {
    const { ok = true, status = 200, json = {}, text = "", headers = {} } = options;
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
