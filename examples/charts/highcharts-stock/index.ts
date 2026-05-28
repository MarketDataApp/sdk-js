/**
 * Highcharts Stock — industry standard for financial dashboards, with
 * built-in range selector, navigator, and OHLC tooltip. NOT free for
 * commercial use; the CDN works for evaluation but production use
 * needs a license. See https://shop.highcharts.com/.
 *
 * https://www.highcharts.com/docs/stock/getting-started-stock
 *
 * Run: pnpm chart:highcharts
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { type Bar, fetchDailyCandles, openInBrowser } from "../_shared/candles";

const __dirname = dirname(fileURLToPath(import.meta.url));

function renderHtml(symbol: string, bars: Bar[]): string {
	const ohlc = bars.map((b) => [b.time * 1000, b.open, b.high, b.low, b.close]);
	const volume = bars.map((b) => [b.time * 1000, b.volume]);

	return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${symbol} — Highcharts Stock</title>
  <script src="https://code.highcharts.com/stock/highstock.js"></script>
  <script src="https://code.highcharts.com/stock/themes/dark-unica.js"></script>
  <style>
    html, body { margin: 0; padding: 0; background: #111; color: #eee; font: 14px -apple-system, system-ui, sans-serif; height: 100%; }
    header { padding: 12px 16px; border-bottom: 1px solid #222; }
    .lic { font-size: 12px; color: #888; }
    #chart { width: 100%; height: calc(100vh - 48px); }
  </style>
</head>
<body>
  <header>
    <strong>${symbol}</strong> · ${bars.length} daily bars · Highcharts Stock
    <span class="lic">— commercial license required for production</span>
  </header>
  <div id="chart"></div>
  <script>
    const ohlc = ${JSON.stringify(ohlc)};
    const volume = ${JSON.stringify(volume)};

    Highcharts.stockChart("chart", {
      rangeSelector: { selected: 1 },
      title: { text: "${symbol} daily" },
      yAxis: [
        { labels: { align: "right", x: -3 }, title: { text: "Price" }, height: "70%", lineWidth: 2 },
        { labels: { align: "right", x: -3 }, title: { text: "Volume" }, top: "75%", height: "25%", offset: 0, lineWidth: 2 },
      ],
      tooltip: { split: true },
      series: [
        { type: "candlestick", name: "${symbol}", data: ohlc, color: "#ef5350", upColor: "#26a69a", lineColor: "#ef5350", upLineColor: "#26a69a" },
        { type: "column", name: "Volume", data: volume, yAxis: 1 },
      ],
    });
  </script>
</body>
</html>`;
}

async function main(): Promise<void> {
	const { symbol, bars } = await fetchDailyCandles();
	const out = resolve(__dirname, "highcharts-stock.html");
	writeFileSync(out, renderHtml(symbol, bars), "utf-8");
	console.log(`Wrote ${bars.length} bars to ${out}`);
	openInBrowser(out);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
