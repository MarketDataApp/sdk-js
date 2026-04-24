/**
 * Stock candles example — fetches AAPL daily candles for the last year,
 * writes a CSV next to the script, and renders a self-contained HTML
 * chart that opens in the default browser via lightweight-charts
 * loaded from a CDN.
 *
 * Mirrors the Python stock_candles_example/ structure: no heavy deps,
 * just the SDK plus whatever is on PATH for opening the browser.
 *
 * Run: pnpm candles
 */
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { MarketDataClient } from "marketdata-sdk";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SYMBOL = "AAPL";
const DAYS = 365;

function openInBrowser(path: string): void {
	const platformOpeners: Record<string, string> = {
		darwin: "open",
		win32: "start",
		linux: "xdg-open",
	};
	const opener = platformOpeners[process.platform];
	if (!opener) {
		console.log(`Open manually: ${path}`);
		return;
	}
	spawn(opener, [path], { detached: true, stdio: "ignore" }).unref();
}

function renderHtml(
	symbol: string,
	bars: ReadonlyArray<{
		time: number;
		open: number;
		high: number;
		low: number;
		close: number;
		volume: number;
	}>,
): string {
	return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${symbol} — candles</title>
  <script src="https://unpkg.com/lightweight-charts@4.2.0/dist/lightweight-charts.standalone.production.js"></script>
  <style>
    html, body { margin: 0; padding: 0; background: #111; color: #eee; font-family: -apple-system, system-ui, sans-serif; }
    header { padding: 12px 16px; border-bottom: 1px solid #222; }
    #chart { height: 70vh; }
    #volume { height: 25vh; }
  </style>
</head>
<body>
  <header><strong>${symbol}</strong> — ${bars.length} daily bars</header>
  <div id="chart"></div>
  <div id="volume"></div>
  <script>
    const bars = ${JSON.stringify(bars)};
    const priceChart = LightweightCharts.createChart(document.getElementById("chart"), {
      layout: { background: { color: "#111" }, textColor: "#eee" },
      grid: { vertLines: { color: "#222" }, horzLines: { color: "#222" } },
    });
    const candles = priceChart.addCandlestickSeries();
    candles.setData(bars.map(b => ({ time: b.time, open: b.open, high: b.high, low: b.low, close: b.close })));

    const volChart = LightweightCharts.createChart(document.getElementById("volume"), {
      layout: { background: { color: "#111" }, textColor: "#eee" },
      grid: { vertLines: { color: "#222" }, horzLines: { color: "#222" } },
    });
    const volume = volChart.addHistogramSeries({ priceFormat: { type: "volume" }, priceScaleId: "" });
    volume.setData(bars.map(b => ({ time: b.time, value: b.volume, color: b.close >= b.open ? "#26a69a" : "#ef5350" })));
  </script>
</body>
</html>`;
}

async function main(): Promise<void> {
	const client = new MarketDataClient();
	await client.ready;

	const to = new Date();
	const from = new Date(to.getTime() - DAYS * 24 * 60 * 60 * 1000);

	const rows = await client.stocks.candles(SYMBOL, {
		resolution: "D",
		from,
		to,
	});

	// Wire format → lightweight-charts bars. Epoch seconds go straight to `time`.
	const bars = rows.map((r) => ({
		time: r.t as number,
		open: r.o as number,
		high: r.h as number,
		low: r.l as number,
		close: r.c as number,
		volume: r.v as number,
	}));

	const csvPath = resolve(__dirname, "candles.csv");
	const htmlPath = resolve(__dirname, "candles.html");

	const csv = [
		"time,open,high,low,close,volume",
		...bars.map((b) => `${b.time},${b.open},${b.high},${b.low},${b.close},${b.volume}`),
	].join("\n");
	writeFileSync(csvPath, csv, "utf-8");
	writeFileSync(htmlPath, renderHtml(SYMBOL, bars), "utf-8");

	console.log(`Wrote ${bars.length} bars to:`);
	console.log(`  ${csvPath}`);
	console.log(`  ${htmlPath}`);
	openInBrowser(htmlPath);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
