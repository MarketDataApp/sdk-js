import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

const runIntegration = process.env.MARKETDATA_RUN_INTEGRATION_TESTS === "true";

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		globals: true,
		setupFiles: ["./tests/setup.ts"],
		// Integration tests are gated behind an env var so they don't run on
		// every local `pnpm test` — they hit the live API and consume credits.
		exclude: runIntegration
			? ["**/node_modules/**", "**/dist/**"]
			: [
					"**/node_modules/**",
					"**/dist/**",
					"**/tests/integration/**",
				],
		coverage: {
			provider: "v8",
			reporter: ["text", "lcov", "html"],
			reportsDirectory: "./coverage",
			include: ["src/**/*.ts"],
			exclude: ["src/index.ts", "**/outputs.ts", "**/types.ts"],
		},
	},
});
