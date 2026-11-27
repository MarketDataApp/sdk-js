import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadSettings } from "@/settings";

const ORIGINAL_CWD = process.cwd();
const createdDirs: string[] = [];
let savedToken: string | undefined;

/**
 * Creates an empty temporary directory that `afterEach` removes.
 *
 * @param prefix - Prefix for the directory name.
 * @returns The absolute path of the new directory.
 */
async function makeTempDir(prefix: string): Promise<string> {
	const dir = await mkdtemp(join(tmpdir(), prefix));
	createdDirs.push(dir);
	return dir;
}

/**
 * Creates a temporary directory holding a `.env` file with the given contents.
 *
 * @param contents - The `.env` file body.
 * @returns The absolute path of the new directory.
 */
async function makeEnvDir(contents: string): Promise<string> {
	const dir = await makeTempDir("sdk-env-");
	await writeFile(join(dir, ".env"), contents);
	return dir;
}

describe("loadSettings .env isolation", () => {
	beforeEach(() => {
		savedToken = process.env.MARKETDATA_TOKEN;
		delete process.env.MARKETDATA_TOKEN;
	});

	afterEach(async () => {
		process.chdir(ORIGINAL_CWD);
		if (savedToken === undefined) delete process.env.MARKETDATA_TOKEN;
		else process.env.MARKETDATA_TOKEN = savedToken;
		delete process.env.UNRELATED_SECRET;
		await Promise.all(
			createdDirs
				.splice(0)
				.map((dir) => rm(dir, { recursive: true, force: true })),
		);
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

	// Re-importing the whole SDK after resetModules can pass 5 s on a cold cache.
	it("leaves process.env alone when the SDK is imported and a client is built", {
		timeout: 30_000,
	}, async () => {
		const dir = await makeEnvDir(
			"MARKETDATA_TOKEN=from-dotenv\nUNRELATED_SECRET=super-secret\n",
		);
		process.chdir(dir);
		vi.resetModules();

		const { MarketDataClient } = await import("@/index");
		const client = new MarketDataClient();
		await client.ready;

		expect(client.token).toBe("from-dotenv");
		expect(process.env.UNRELATED_SECRET).toBeUndefined();
		expect(process.env.MARKETDATA_TOKEN).toBeUndefined();
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
		const dir = await makeTempDir("sdk-noenv-");
		process.chdir(dir);

		expect(loadSettings().marketdataToken).toBeUndefined();
	});
});
