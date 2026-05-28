/**
 * Plotly.js — MIT, well-known data-science charting library with a
 * native candlestick trace and a built-in rangeslider for OHLC.
 *
 * https://plotly.com/javascript/candlestick-charts/
 *
 * Run: pnpm chart:plotly
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { type Bar, fetchDailyCandles, openInBrowser } from "../_shared/candles";

const __dirname = dirname(fileURLToPath(import.meta.url));

function renderHtml(symbol: string, bars: Bar[]): string {
	const dates = bars.map((b) =>
		new Date(b.time * 1000).toISOString().slice(0, 10),
	);
	const open = bars.map((b) => b.open);
	const high = bars.map((b) => b.high);
	const low = bars.map((b) => b.low);
	const close = bars.map((b) => b.close);
	const volume = bars.map((b) => b.volume);
	const volumeColors = bars.map((b) =>
		b.close >= b.open ? "rgba(38,166,154,0.6)" : "rgba(239,83,80,0.6)",
	);

	return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${symbol} — Plotly</title>
  <script src="https://cdn.plot.ly/plotly-2.35.2.min.js" charset="utf-8"></script>
  <style>
    html, body { margin: 0; padding: 0; background: #111; color: #eee; font: 14px -apple-system, system-ui, sans-serif; height: 100%; }
    header { padding: 12px 16px; border-bottom: 1px solid #222; }
    #chart { width: 100%; height: calc(100vh - 48px); }
  </style>
</head>
<body>
  <header><strong>${symbol}</strong> · ${bars.length} daily bars · Plotly.js</header>
  <div id="chart"></div>
  <script>
    const x = ${JSON.stringify(dates)};
    const traces = [
      {
        type: "candlestick",
        name: "${symbol}",
        x: x,
        open: ${JSON.stringify(open)},
        high: ${JSON.stringify(high)},
        low: ${JSON.stringify(low)},
        close: ${JSON.stringify(close)},
        increasing: { line: { color: "#26a69a" }, fillcolor: "#26a69a" },
        decreasing: { line: { color: "#ef5350" }, fillcolor: "#ef5350" },
        yaxis: "y",
        xaxis: "x",
      },
      {
        type: "bar",
        name: "Volume",
        x: x,
        y: ${JSON.stringify(volume)},
        marker: { color: ${JSON.stringify(volumeColors)} },
        yaxis: "y2",
        xaxis: "x",
      },
    ];

    const layout = {
      paper_bgcolor: "#111",
      plot_bgcolor: "#111",
      font: { color: "#eee" },
      margin: { t: 24, r: 40, b: 40, l: 60 },
      showlegend: false,
      xaxis: { rangeslider: { visible: true, thickness: 0.05 }, gridcolor: "#222" },
      yaxis: { domain: [0.25, 1], title: "Price", gridcolor: "#222" },
      yaxis2: { domain: [0, 0.2], title: "Volume", gridcolor: "#222" },
    };

    Plotly.newPlot("chart", traces, layout, { responsive: true, displaylogo: false });
  </script>
</body>
</html>`;
}

async function main(): Promise<void> {
	const { symbol, bars } = await fetchDailyCandles();
	const out = resolve(__dirname, "plotly.html");
	writeFileSync(out, renderHtml(symbol, bars), "utf-8");
	console.log(`Wrote ${bars.length} bars to ${out}`);
	openInBrowser(out);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
