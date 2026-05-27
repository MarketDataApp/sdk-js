/**
 * Options chain monitor — polls an underlying on an interval and renders
 * a colourful terminal table that highlights row-level changes (bid/ask/
 * last/mid delta) between snapshots.
 *
 * Calls are laid out on the left, puts on the right, strike in the middle.
 * No expiration is passed, so the API returns the next monthly expiration;
 * the expiration date and underlying price are surfaced in the title bar.
 *
 * Before the polling loop a one-shot `?date=last session` chain request
 * captures each contract's previous-session close. The `last %` column then
 * shows ((last − prevClose) / prevClose) × 100, coloured green/red, while the
 * ▲/▼ arrows on bid/ask/mid/last track movement between successive polls.
 *
 * Usage:
 *   pnpm monitor [UNDERLYING] [INTERVAL_SECONDS]
 *   pnpm monitor                  # AAPL, 15s interval
 *   pnpm monitor TSLA 10
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

interface Snapshot {
	rows: Row[];
	expiration: number;
	underlyingPrice: number;
}

function fmtNum(n: number | undefined | null, digits = 2): string {
	if (n == null || Number.isNaN(n)) return "-";
	return n.toFixed(digits);
}

function fmtInt(n: number | undefined | null): string {
	if (n == null) return "-";
	return String(n);
}

function fmtIv(iv: number | undefined): string {
	if (iv == null || Number.isNaN(iv)) return "-";
	return `${(iv * 100).toFixed(1)}%`;
}

function colourDelta(
	current: number,
	previous: number | undefined,
	digits = 2,
): string {
	const fmt = fmtNum(current, digits);
	if (previous === undefined || Number.isNaN(current) || fmt === "-")
		return fmt;
	if (current > previous) return chalk.green(`▲ ${fmt}`);
	if (current < previous) return chalk.red(`▼ ${fmt}`);
	return chalk.dim(fmt);
}

// Percent change of `last` vs the previous-session close, green/red coloured.
function colourPct(current: number, baseline: number | undefined): string {
	if (
		baseline === undefined ||
		baseline === 0 ||
		Number.isNaN(current) ||
		Number.isNaN(baseline)
	)
		return "-";
	const pct = ((current - baseline) / baseline) * 100;
	const s = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
	if (pct > 0) return chalk.green(s);
	if (pct < 0) return chalk.red(s);
	return chalk.dim(s);
}

// Per-column inner widths (matches cli-table3 colWidths minus 2 for padding).
const COL_WIDTHS = [6, 5, 6, 7, 8, 7, 7, 7, 8, 7, 7, 7, 8, 7, 6, 5, 6] as const;
const STRIKE_COL_INDEX = 8;

function tableColWidths(): number[] {
	return COL_WIDTHS.map((w) => w + 2);
}

function supergroupHeader(totalWidth: number): string {
	// The "strike" column owns the centre, so the divider sits under its
	// vertical border. Compute that position from the cumulative colWidths.
	const widths = tableColWidths();
	let pos = 1; // leftmost outer border
	for (let i = 0; i < STRIKE_COL_INDEX; i++) {
		pos += widths[i] + 1; // content + right border
	}
	// `pos` now points to the column index where the strike column begins.
	// We want a divider at strike-column centre: pos + floor(widths[strike] / 2).
	const dividerCol = pos + Math.floor(widths[STRIKE_COL_INDEX] / 2);

	const leftLabel = "CALL";
	const rightLabel = "PUT";
	const leftCentre = Math.floor(dividerCol / 2);
	const rightCentre = dividerCol + Math.floor((totalWidth - dividerCol) / 2);

	const buf = " ".repeat(totalWidth).split("");
	for (let i = 0; i < leftLabel.length; i++) {
		buf[leftCentre - Math.floor(leftLabel.length / 2) + i] = leftLabel[i];
	}
	buf[dividerCol] = "│";
	for (let i = 0; i < rightLabel.length; i++) {
		buf[rightCentre - Math.floor(rightLabel.length / 2) + i] = rightLabel[i];
	}
	return chalk.bold(buf.join(""));
}

function renderTable(
	underlying: string,
	snap: Snapshot,
	previous: Map<string, Row>,
	baseline: Map<string, number>,
	updatedAt: Date,
): string {
	const head = [
		"OI",
		"Vol",
		"IV",
		"last",
		"last %",
		"mid",
		"bid",
		"ask",
		"strike",
		"bid",
		"ask",
		"mid",
		"last %",
		"last",
		"IV",
		"Vol",
		"OI",
	].map((h) => chalk.bold(h));

	const aligns: Array<"left" | "right" | "center"> = [
		"right",
		"right",
		"right",
		"right",
		"right",
		"right",
		"right",
		"right",
		"center",
		"right",
		"right",
		"right",
		"right",
		"right",
		"right",
		"right",
		"right",
	];

	const table = new Table({
		head,
		colAligns: aligns,
		colWidths: tableColWidths(),
		style: { head: [], border: ["grey"] },
	});

	// Group by strike.
	const byStrike = new Map<number, { call?: Row; put?: Row }>();
	for (const r of snap.rows) {
		const bucket = byStrike.get(r.strike) ?? {};
		if (r.side === "call") bucket.call = r;
		else if (r.side === "put") bucket.put = r;
		byStrike.set(r.strike, bucket);
	}
	const strikes = [...byStrike.keys()].sort((a, b) => a - b);

	for (const strike of strikes) {
		const { call, put } = byStrike.get(strike) ?? {};
		const c = call;
		const p = put;
		const cp = c ? previous.get(c.optionSymbol) : undefined;
		const pp = p ? previous.get(p.optionSymbol) : undefined;
		table.push([
			c ? fmtInt(c.openInterest) : "",
			c ? fmtInt(c.volume) : "",
			c ? fmtIv(c.iv) : "",
			c ? colourDelta(c.last, cp?.last) : "",
			c ? colourPct(c.last, baseline.get(c.optionSymbol)) : "",
			c ? colourDelta(c.mid, cp?.mid) : "",
			c ? colourDelta(c.bid, cp?.bid) : "",
			c ? colourDelta(c.ask, cp?.ask) : "",
			chalk.bold(fmtNum(strike)),
			p ? colourDelta(p.bid, pp?.bid) : "",
			p ? colourDelta(p.ask, pp?.ask) : "",
			p ? colourDelta(p.mid, pp?.mid) : "",
			p ? colourPct(p.last, baseline.get(p.optionSymbol)) : "",
			p ? colourDelta(p.last, pp?.last) : "",
			p ? fmtIv(p.iv) : "",
			p ? fmtInt(p.volume) : "",
			p ? fmtInt(p.openInterest) : "",
		]);
	}

	const tableStr = table.toString();
	const tableWidth = tableStr.split("\n")[0].length;

	const expDate = new Date(snap.expiration * 1000).toISOString().slice(0, 10);
	const left = `${underlying}  exp ${expDate}  —  ${snap.rows.length} contracts`;
	const right = `$${snap.underlyingPrice.toFixed(2)}`;
	const gap = Math.max(2, tableWidth - left.length - right.length);
	const title = chalk.bold(left) + " ".repeat(gap) + chalk.bold(right);
	const subtitle = chalk.dim(`updated ${updatedAt.toLocaleTimeString()}`);
	const supergroup = supergroupHeader(tableWidth);

	return `${title}\n${subtitle}\n${supergroup}\n${tableStr}`;
}

function clearScreen(): void {
	process.stdout.write("\x1B[2J\x1B[0f");
}

async function snapshot(
	client: MarketDataClient,
	underlying: string,
): Promise<Snapshot> {
	const rows = await client.options.chain(underlying);
	const mapped = (
		rows as unknown as Array<
			Row & { expiration: number; underlyingPrice: number }
		>
	).map((r) => ({
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
		expiration: Number(r.expiration),
		underlyingPrice: Number(r.underlyingPrice),
	}));
	const first = mapped[0];
	return {
		rows: mapped,
		expiration: first?.expiration ?? 0,
		underlyingPrice: first?.underlyingPrice ?? 0,
	};
}

// One-shot previous-session close, keyed by option symbol. Seeds the `last %`
// column so deltas-vs-close show from the very first render. Best-effort: on
// failure the column simply renders "-".
async function fetchBaseline(
	client: MarketDataClient,
	underlying: string,
): Promise<Map<string, number>> {
	const map = new Map<string, number>();
	try {
		const rows = await client.options.chain(underlying, {
			date: "last session",
		});
		for (const r of rows as unknown as Array<{
			optionSymbol: string;
			last: number;
		}>) {
			const last = Number(r.last);
			if (r.optionSymbol && !Number.isNaN(last)) map.set(r.optionSymbol, last);
		}
	} catch {
		console.error(
			chalk.yellow(
				"Could not fetch previous-session close — last % will be blank",
			),
		);
	}
	return map;
}

async function main(): Promise<void> {
	const [, , underlyingArg, intervalArg] = process.argv;
	const underlying = (underlyingArg ?? "AAPL").toUpperCase();
	const interval = Math.max(5, Number(intervalArg ?? 15));

	const client = new MarketDataClient();
	await client.ready;

	const baseline = await fetchBaseline(client, underlying);
	let previous = new Map<string, Row>();
	let stopped = false;
	process.on("SIGINT", () => {
		stopped = true;
		console.log("\nStopping…");
	});

	while (!stopped) {
		try {
			const snap = await snapshot(client, underlying);
			clearScreen();
			console.log(
				renderTable(underlying, snap, previous, baseline, new Date()),
			);
			previous = new Map(snap.rows.map((r) => [r.optionSymbol, r]));
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
