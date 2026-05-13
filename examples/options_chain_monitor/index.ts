/**
 * Options chain monitor — polls an underlying + expiration on an
 * interval and renders a colourful terminal table that highlights
 * row-level changes (bid/ask/last delta) between snapshots.
 *
 * Usage:
 *   pnpm monitor <UNDERLYING> <EXPIRATION> [INTERVAL_SECONDS]
 *   pnpm monitor AAPL 2026-06-19 15
 *
 * AAPL options are in the free tier, so a token is not required for the
 * default example. Other underlyings need MARKETDATA_TOKEN set.
 */
import chalk from "chalk";
import Table from "cli-table3";
import { MarketDataClient, RateLimitError } from "marketdata-sdk";

interface Row {
	optionSymbol: string;
	side: string;
	strike: number;
	bid: number;
	ask: number;
	mid: number;
	last: number;
	iv?: number;
	volume: number;
	openInterest: number;
}

function colourDelta(current: number, previous?: number): string {
	const fmt = current.toFixed(2);
	if (previous === undefined || Number.isNaN(current)) return fmt;
	if (current > previous) return chalk.green(`▲ ${fmt}`);
	if (current < previous) return chalk.red(`▼ ${fmt}`);
	return chalk.dim(fmt);
}

function renderTable(
	underlying: string,
	expiration: string,
	current: Row[],
	previous: Map<string, Row>,
	updatedAt: Date,
): string {
	const table = new Table({
		head: [
			chalk.bold("Strike"),
			chalk.bold("Side"),
			chalk.bold("Bid"),
			chalk.bold("Ask"),
			chalk.bold("Mid"),
			chalk.bold("Last"),
			chalk.bold("IV"),
			chalk.bold("Vol"),
			chalk.bold("OI"),
		],
		colAligns: [
			"right",
			"center",
			"right",
			"right",
			"right",
			"right",
			"right",
			"right",
			"right",
		],
		style: { head: [], border: ["grey"] },
	});

	const sorted = [...current].sort((a, b) => a.strike - b.strike);
	for (const r of sorted) {
		const prev = previous.get(r.optionSymbol);
		table.push([
			r.strike.toFixed(2),
			r.side === "call" ? chalk.cyan("C") : chalk.magenta("P"),
			colourDelta(r.bid, prev?.bid),
			colourDelta(r.ask, prev?.ask),
			colourDelta(r.mid, prev?.mid),
			colourDelta(r.last, prev?.last),
			r.iv != null ? (r.iv * 100).toFixed(1) : "-",
			String(r.volume ?? 0),
			String(r.openInterest ?? 0),
		]);
	}

	const header =
		chalk.bold(`${underlying}  exp ${expiration}`) +
		chalk.dim(
			`  —  ${current.length} contracts  —  ${updatedAt.toLocaleTimeString()}`,
		);
	return `${header}\n${table.toString()}`;
}

function clearScreen(): void {
	process.stdout.write("\x1B[2J\x1B[0f");
}

async function snapshot(
	client: MarketDataClient,
	underlying: string,
	expiration: string,
): Promise<Row[]> {
	const rows = await client.options.chain(underlying, { expiration });
	return (rows as unknown as Row[]).map((r) => ({
		optionSymbol: r.optionSymbol,
		side: r.side,
		strike: Number(r.strike),
		bid: Number(r.bid),
		ask: Number(r.ask),
		mid: Number(r.mid),
		last: Number(r.last),
		iv: r.iv != null ? Number(r.iv) : undefined,
		volume: Number(r.volume ?? 0),
		openInterest: Number(r.openInterest ?? 0),
	}));
}

async function main(): Promise<void> {
	const [, , underlying, expiration, intervalArg] = process.argv;
	if (!underlying || !expiration) {
		console.error(
			"Usage: pnpm monitor <UNDERLYING> <EXPIRATION> [INTERVAL_SECONDS]",
		);
		console.error("Example: pnpm monitor AAPL 2026-06-19 15");
		process.exit(1);
	}
	const interval = Math.max(5, Number(intervalArg ?? 15));

	const client = new MarketDataClient();
	await client.ready;

	let previous = new Map<string, Row>();
	let stopped = false;
	process.on("SIGINT", () => {
		stopped = true;
		console.log("\nStopping…");
	});

	while (!stopped) {
		try {
			const rows = await snapshot(client, underlying, expiration);
			clearScreen();
			console.log(
				renderTable(underlying, expiration, rows, previous, new Date()),
			);
			previous = new Map(rows.map((r) => [r.optionSymbol, r]));
		} catch (err) {
			if (err instanceof RateLimitError) {
				console.error(chalk.yellow("Rate limit — sleeping one interval"));
			} else {
				console.error(chalk.red("Fetch error:"), err);
			}
		}
		if (!stopped) await new Promise((r) => setTimeout(r, interval * 1000));
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
