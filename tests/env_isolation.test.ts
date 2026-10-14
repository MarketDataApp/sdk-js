import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadSettings } from "@/settings";

const ORIGINAL_CWD = process.cwd();
let savedToken: string | undefined;

async function makeEnvDir(contents: string): Promise<string> {
	const dir = await mkdtemp(join(tmpdir(), "sdk-env-"));
	await writeFile(join(dir, ".env"), contents);
	return dir;
}

describe("loadSettings .env isolation", () => {
	beforeEach(() => {
		savedToken = process.env.MARKETDATA_TOKEN;
		delete process.env.MARKETDATA_TOKEN;
	});

	afterEach(() => {
		process.chdir(ORIGINAL_CWD);
		if (savedToken === undefined) delete process.env.MARKETDATA_TOKEN;
		else process.env.MARKETDATA_TOKEN = savedToken;
		delete process.env.UNRELATED_SECRET;
	});

	it("reads MARKETDATA_* values from .env without mutating process.env", async () => {
		const dir = await makeEnvDir(
			"MARKETDATA_TOKEN=from-dotenv\nUNRELATED_SECRET=super-secret\n",
		);
		process.chdir(dir);

		const settings = loadSettings();

		expect(settings.marketdataToken).toBe("from-dotenv");
		expect(process.env.MARKETDATA_TOKEN).toBeUndefined();
		expect(process.env.UNRELATED_SECRET).toBeUndefined();
	});

	it("prefers a real environment variable over the .env value", async () => {
		const dir = await makeEnvDir("MARKETDATA_TOKEN=from-dotenv\n");
		process.chdir(dir);
		process.env.MARKETDATA_TOKEN = "from-env";

		expect(loadSettings().marketdataToken).toBe("from-env");
	});

	it("prefers an explicit override over both", async () => {
		const dir = await makeEnvDir("MARKETDATA_TOKEN=from-dotenv\n");
		process.chdir(dir);
		process.env.MARKETDATA_TOKEN = "from-env";

		expect(
			loadSettings({ marketdataToken: "from-config" }).marketdataToken,
		).toBe("from-config");
	});

	it("works without a .env file", async () => {
		const dir = await mkdtemp(join(tmpdir(), "sdk-noenv-"));
		process.chdir(dir);

		expect(loadSettings().marketdataToken).toBeUndefined();
	});
});
