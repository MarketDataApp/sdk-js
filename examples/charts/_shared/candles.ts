/**
 * Shared helpers for the chart examples. Each chart-library example
 * fetches the same dataset through the SDK so the diffs between
 * scripts are about chart wiring, not data loading.
 */
import { spawn } from "node:child_process";
import { MarketDataClient } from "@marketdata/sdk";

export interface Bar {
	/** Epoch seconds, as returned by the API. */
	time: number;
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
}

export interface FetchCandlesOptions {
	symbol?: string;
	days?: number;
}

const DEFAULT_SYMBOL = "AAPL";
const DEFAULT_DAYS = 365;

export async function fetchDailyCandles(
	opts: FetchCandlesOptions = {},
): Promise<{ symbol: string; bars: Bar[] }> {
	const symbol = opts.symbol ?? DEFAULT_SYMBOL;
	const days = opts.days ?? DEFAULT_DAYS;

	const client = new MarketDataClient();
	await client.ready;

	const to = new Date();
	const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);

	const rows = await client.stocks.candles(symbol, {
		resolution: "D",
		from,
		to,
	});

	const bars: Bar[] = rows.map((r) => ({
		time: r.t,
		open: r.o,
		high: r.h,
		low: r.l,
		close: r.c,
		volume: r.v,
	}));

	return { symbol, bars };
}

export function openInBrowser(path: string): void {
	const openers: Record<string, string> = {
		darwin: "open",
		win32: "start",
		linux: "xdg-open",
	};
	const opener = openers[process.platform];
	if (!opener) {
		console.log(`Open manually: ${path}`);
		return;
	}
	spawn(opener, [path], { detached: true, stdio: "ignore" }).unref();
}
