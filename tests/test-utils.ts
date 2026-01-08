import { readFileSync } from "node:fs";
import { join } from "node:path";

export function loadMock<T = unknown>(name: string): T {
    const path = join(__dirname, "mocks", `${name}.json`);
    return JSON.parse(readFileSync(path, "utf-8")) as T;
}
