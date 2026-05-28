/**
 * Apache ECharts — Apache-2.0, very strong candlestick + financial
 * support. Two linked grids share a dataZoom axis so price + volume
 * pan together.
 *
 * https://echarts.apache.org/en/option.html#series-candlestick
 *
 * Note: ECharts candlestick `data` order is [open, close, low, high],
 * NOT [open, high, low, close]. Easy to get wrong.
 *
 * Run: pnpm chart:echarts
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { type Bar, fetchDailyCandles, openInBrowser } from "../_shared/candles";

const __dirname = dirname(fileURLToPath(import.meta.url));

function renderHtml(symbol: string, bars: Bar[]): string {
	const categories = bars.map((b) =>
		new Date(b.time * 1000).toISOString().slice(0, 10),
	);
	const candleData = bars.map((b) => [b.open, b.close, b.low, b.high]);
	const volumeData = bars.map((b) => ({
		value: b.volume,
		itemStyle: { color: b.close >= b.open ? "#26a69a" : "#ef5350" },
	}));

	return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${symbol} — ECharts</title>
  <script src="https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js"></script>
  <style>
    html, body { margin: 0; padding: 0; background: #111; color: #eee; font: 14px -apple-system, system-ui, sans-serif; height: 100%; }
    header { padding: 12px 16px; border-bottom: 1px solid #222; }
    #chart { width: 100%; height: calc(100vh - 48px); }
  </style>
</head>
<body>
  <header><strong>${symbol}</strong> · ${bars.length} daily bars · Apache ECharts 5</header>
  <div id="chart"></div>
  <script>
    const categories = ${JSON.stringify(categories)};
    const candles = ${JSON.stringify(candleData)};
    const volume = ${JSON.stringify(volumeData)};

    const chart = echarts.init(document.getElementById("chart"), "dark");
    chart.setOption({
      backgroundColor: "#111",
      tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
      axisPointer: { link: [{ xAxisIndex: "all" }] },
      grid: [
        { left: 60, right: 20, top: 30, height: "60%" },
        { left: 60, right: 20, top: "75%", height: "18%" },
      ],
      xAxis: [
        { type: "category", data: categories, scale: true, boundaryGap: false, axisLine: { onZero: false }, splitLine: { show: false } },
        { type: "category", gridIndex: 1, data: categories, scale: true, boundaryGap: false, splitLine: { show: false }, axisLabel: { show: false } },
      ],
      yAxis: [
        { scale: true, splitArea: { show: false } },
        { gridIndex: 1, splitNumber: 2, axisLabel: { show: false }, axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false } },
      ],
      dataZoom: [
        { type: "inside", xAxisIndex: [0, 1], start: 70, end: 100 },
        { show: true, xAxisIndex: [0, 1], type: "slider", bottom: 10, start: 70, end: 100 },
      ],
      series: [
        {
          type: "candlestick",
          data: candles,
          itemStyle: {
            color: "#26a69a", color0: "#ef5350",
            borderColor: "#26a69a", borderColor0: "#ef5350",
          },
        },
        { type: "bar", xAxisIndex: 1, yAxisIndex: 1, data: volume },
      ],
    });

    window.addEventListener("resize", () => chart.resize());
  </script>
</body>
</html>`;
}

async function main(): Promise<void> {
	const { symbol, bars } = await fetchDailyCandles();
	const out = resolve(__dirname, "echarts.html");
	writeFileSync(out, renderHtml(symbol, bars), "utf-8");
	console.log(`Wrote ${bars.length} bars to ${out}`);
	openInBrowser(out);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
