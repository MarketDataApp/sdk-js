/**
 * TradingView Lightweight Charts — purpose-built for finance, free,
 * MIT-licensed. Standalone IIFE bundle loaded from unpkg.
 *
 * https://tradingview.github.io/lightweight-charts/
 *
 * Run: pnpm chart:lightweight
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { type Bar, fetchDailyCandles, openInBrowser } from "../_shared/candles";

const __dirname = dirname(fileURLToPath(import.meta.url));

function renderHtml(symbol: string, bars: Bar[]): string {
	return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${symbol} — Lightweight Charts</title>
  <script src="https://unpkg.com/lightweight-charts@4.2.0/dist/lightweight-charts.standalone.production.js"></script>
  <style>
    html, body { margin: 0; padding: 0; background: #111; color: #eee; font: 14px -apple-system, system-ui, sans-serif; }
    header { padding: 12px 16px; border-bottom: 1px solid #222; }
    #price { height: 65vh; }
    #volume { height: 25vh; }
  </style>
</head>
<body>
  <header><strong>${symbol}</strong> · ${bars.length} daily bars · Lightweight Charts 4.x</header>
  <div id="price"></div>
  <div id="volume"></div>
  <script>
    const bars = ${JSON.stringify(bars)};
    const baseOpts = {
      layout: { background: { color: "#111" }, textColor: "#eee" },
      grid: { vertLines: { color: "#222" }, horzLines: { color: "#222" } },
      timeScale: { timeVisible: true, secondsVisible: false },
    };

    const priceChart = LightweightCharts.createChart(document.getElementById("price"), baseOpts);
    const candles = priceChart.addCandlestickSeries({
      upColor: "#26a69a", downColor: "#ef5350",
      borderUpColor: "#26a69a", borderDownColor: "#ef5350",
      wickUpColor: "#26a69a", wickDownColor: "#ef5350",
    });
    candles.setData(bars.map(b => ({ time: b.time, open: b.open, high: b.high, low: b.low, close: b.close })));

    const volumeChart = LightweightCharts.createChart(document.getElementById("volume"), baseOpts);
    const volume = volumeChart.addHistogramSeries({ priceFormat: { type: "volume" } });
    volume.setData(bars.map(b => ({
      time: b.time,
      value: b.volume,
      color: b.close >= b.open ? "rgba(38,166,154,0.6)" : "rgba(239,83,80,0.6)",
    })));

    // Keep the time scales in sync between the two charts.
    priceChart.timeScale().subscribeVisibleLogicalRangeChange(r => r && volumeChart.timeScale().setVisibleLogicalRange(r));
    volumeChart.timeScale().subscribeVisibleLogicalRangeChange(r => r && priceChart.timeScale().setVisibleLogicalRange(r));
  </script>
</body>
</html>`;
}

async function main(): Promise<void> {
	const { symbol, bars } = await fetchDailyCandles();
	const out = resolve(__dirname, "lightweight-charts.html");
	writeFileSync(out, renderHtml(symbol, bars), "utf-8");
	console.log(`Wrote ${bars.length} bars to ${out}`);
	openInBrowser(out);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
