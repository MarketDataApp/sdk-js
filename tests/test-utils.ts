import { readFileSync } from "node:fs";
import { join } from "node:path";

export function loadMock(name: string): any {
    const path = join(__dirname, "mocks", `${name}.json`);
    return JSON.parse(readFileSync(path, "utf-8"));
}
