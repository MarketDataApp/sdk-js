/**
 * Chart.js 4 — MIT, the most popular general charting library. Used
 * here for an options-chain greeks chart: pick an underlying, fetch
 * the full chain (next monthly expiration by default), and let the
 * viewer switch between IV and the four greeks across strikes. Calls
 * and puts render as two lines on the same axis.
 *
 * https://www.chartjs.org/
 *
 * Run: pnpm chart:chartjs [UNDERLYING]
 *      pnpm chart:chartjs               # AAPL
 *      pnpm chart:chartjs TSLA
 *
 * AAPL options are in the free tier; other underlyings need
 * MARKETDATA_TOKEN set.
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { MarketDataClient } from "@marketdata/sdk";
import { openInBrowser } from "../_shared/candles";

const __dirname = dirname(fileURLToPath(import.meta.url));

const METRICS = ["iv", "delta", "gamma", "theta", "vega"] as const;
type Metric = (typeof METRICS)[number];

interface Point {
	x: number;
	y: number;
}

interface ChainSummary {
	underlying: string;
	expiration: number;
	underlyingPrice: number;
	contractCount: number;
	series: Record<"call" | "put", Record<Metric, Point[]>>;
}

async function fetchChain(underlying: string): Promise<ChainSummary> {
	const client = new MarketDataClient();
	await client.ready;

	const rows = await client.options.chain(underlying);
	if (rows.length === 0) {
		throw new Error(`Empty options chain for ${underlying}`);
	}

	const series: ChainSummary["series"] = {
		call: { iv: [], delta: [], gamma: [], theta: [], vega: [] },
		put: { iv: [], delta: [], gamma: [], theta: [], vega: [] },
	};

	for (const r of rows) {
		const side = r.side === "call" || r.side === "put" ? r.side : null;
		if (!side) continue;
		const strike = Number(r.strike);
		for (const m of METRICS) {
			const raw = r[m];
			if (raw == null || Number.isNaN(Number(raw))) continue;
			series[side][m].push({ x: strike, y: Number(raw) });
		}
	}

	for (const side of ["call", "put"] as const) {
		for (const m of METRICS) {
			series[side][m].sort((a, b) => a.x - b.x);
		}
	}

	const first = rows[0];
	return {
		underlying,
		expiration: Number(first.expiration),
		underlyingPrice: Number(first.underlyingPrice),
		contractCount: rows.length,
		series,
	};
}

function renderHtml(summary: ChainSummary): string {
	const expDate = new Date(summary.expiration * 1000)
		.toISOString()
		.slice(0, 10);
	const priceStr = summary.underlyingPrice.toFixed(2);
	const title = `${summary.underlying} · exp ${expDate} · ${summary.contractCount} contracts · $${priceStr}`;

	return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${summary.underlying} — Chart.js options greeks</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    html, body { margin: 0; padding: 0; background: #111; color: #eee; font: 14px -apple-system, system-ui, sans-serif; height: 100%; }
    header { padding: 12px 16px; border-bottom: 1px solid #222; display: flex; align-items: center; gap: 16px; }
    header .title { font-weight: 600; }
    header select { background: #1a1a1a; color: #eee; border: 1px solid #333; padding: 6px 10px; border-radius: 4px; font-size: 14px; }
    .pane { padding: 12px; height: calc(100vh - 80px); }
    #chart { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <header>
    <span class="title">${title}</span>
    <label>Metric
      <select id="metric">
        <option value="iv">Implied Volatility</option>
        <option value="delta">Delta</option>
        <option value="gamma">Gamma</option>
        <option value="theta">Theta</option>
        <option value="vega">Vega</option>
      </select>
    </label>
  </header>
  <div class="pane"><canvas id="chart"></canvas></div>
  <script>
    const series = ${JSON.stringify(summary.series)};
    const underlyingPrice = ${summary.underlyingPrice};
    const metricLabels = {
      iv: "Implied Volatility",
      delta: "Delta",
      gamma: "Gamma",
      theta: "Theta",
      vega: "Vega",
    };

    const axis = { ticks: { color: "#888" }, grid: { color: "#222" } };

    const chart = new Chart(document.getElementById("chart"), {
      type: "line",
      data: { datasets: [
        { label: "Calls", data: [], borderColor: "#26a69a", backgroundColor: "#26a69a", pointRadius: 2, tension: 0.2 },
        { label: "Puts",  data: [], borderColor: "#ef5350", backgroundColor: "#ef5350", pointRadius: 2, tension: 0.2 },
      ] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        parsing: false,
        plugins: {
          legend: { labels: { color: "#eee" } },
          tooltip: { callbacks: { title: (items) => "Strike $" + items[0].parsed.x.toFixed(2) } },
          annotation: undefined,
        },
        scales: {
          x: { type: "linear", title: { display: true, text: "Strike", color: "#aaa" }, ...axis },
          y: { title: { display: true, text: "", color: "#aaa" }, ...axis },
        },
      },
    });

    function applyMetric(metric) {
      chart.data.datasets[0].data = series.call[metric];
      chart.data.datasets[1].data = series.put[metric];
      chart.options.scales.y.title.text = metricLabels[metric];
      chart.update();
    }

    document.getElementById("metric").addEventListener("change", (e) => applyMetric(e.target.value));
    applyMetric("iv");
  </script>
</body>
</html>`;
}

async function main(): Promise<void> {
	const [, , underlyingArg] = process.argv;
	const underlying = (underlyingArg ?? "AAPL").toUpperCase();

	const summary = await fetchChain(underlying);
	const out = resolve(__dirname, "chartjs.html");
	writeFileSync(out, renderHtml(summary), "utf-8");
	console.log(`Wrote ${summary.contractCount} contracts to ${out}`);
	openInBrowser(out);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
