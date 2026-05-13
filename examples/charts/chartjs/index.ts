/**
 * Chart.js 4 + chartjs-chart-financial — MIT, the most popular general
 * charting library. The `financial` plugin adds candlestick + OHLC
 * chart types and auto-registers when loaded as a UMD bundle.
 *
 * https://github.com/chartjs/chartjs-chart-financial
 *
 * Run: pnpm chart:chartjs
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { type Bar, fetchDailyCandles, openInBrowser } from "../_shared/candles";

const __dirname = dirname(fileURLToPath(import.meta.url));

function renderHtml(symbol: string, bars: Bar[]): string {
	const candleData = bars.map((b) => ({
		x: b.time * 1000,
		o: b.open,
		h: b.high,
		l: b.low,
		c: b.close,
	}));
	const volumeData = bars.map((b) => ({ x: b.time * 1000, y: b.volume }));
	const volumeColors = bars.map((b) =>
		b.close >= b.open ? "rgba(38,166,154,0.6)" : "rgba(239,83,80,0.6)",
	);

	return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${symbol} — Chart.js financial</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/luxon@3.4.4/build/global/luxon.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-luxon@1.3.1/dist/chartjs-adapter-luxon.umd.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chartjs-chart-financial@0.2.1/dist/chartjs-chart-financial.js"></script>
  <style>
    html, body { margin: 0; padding: 0; background: #111; color: #eee; font: 14px -apple-system, system-ui, sans-serif; }
    header { padding: 12px 16px; border-bottom: 1px solid #222; }
    .pane { padding: 12px; }
    #price { height: 60vh; }
    #volume { height: 22vh; }
  </style>
</head>
<body>
  <header><strong>${symbol}</strong> · ${bars.length} daily bars · Chart.js 4 + chartjs-chart-financial</header>
  <div class="pane"><canvas id="price"></canvas></div>
  <div class="pane"><canvas id="volume"></canvas></div>
  <script>
    const candles = ${JSON.stringify(candleData)};
    const volume = ${JSON.stringify(volumeData)};
    const volumeColors = ${JSON.stringify(volumeColors)};

    const sharedTimeAxis = {
      type: "time",
      time: { unit: "month" },
      ticks: { color: "#888" },
      grid: { color: "#222" },
    };

    new Chart(document.getElementById("price"), {
      type: "candlestick",
      data: {
        datasets: [{
          label: "${symbol}",
          data: candles,
          color: { up: "#26a69a", down: "#ef5350", unchanged: "#888" },
          borderColor: { up: "#26a69a", down: "#ef5350", unchanged: "#888" },
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: "#eee" } } },
        scales: {
          x: sharedTimeAxis,
          y: { ticks: { color: "#888" }, grid: { color: "#222" } },
        },
      },
    });

    new Chart(document.getElementById("volume"), {
      type: "bar",
      data: {
        datasets: [{
          label: "Volume",
          data: volume,
          backgroundColor: volumeColors,
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: sharedTimeAxis,
          y: { ticks: { color: "#888" }, grid: { color: "#222" } },
        },
      },
    });
  </script>
</body>
</html>`;
}

async function main(): Promise<void> {
	const { symbol, bars } = await fetchDailyCandles();
	const out = resolve(__dirname, "chartjs.html");
	writeFileSync(out, renderHtml(symbol, bars), "utf-8");
	console.log(`Wrote ${bars.length} bars to ${out}`);
	openInBrowser(out);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
