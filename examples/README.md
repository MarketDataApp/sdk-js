# marketdata-sdk examples

Runnable snippets showing typical integrations. These are not part of the published SDK; they live here so contributors have end-to-end working references.

```bash
cd examples
pnpm install
```

Set `MARKETDATA_TOKEN` in a root-level `.env` or in your shell if you want authenticated endpoints. The default `AAPL` symbol works on the free tier.

## Chart libraries on `stocks.candles`

Five candlestick examples on a common dataset (1 year of AAPL daily candles). Each script writes a self-contained HTML file next to itself and opens it in your default browser. The chart library is loaded from a public CDN — there are no per-library `npm install` steps.

| Library | Command | Output file | License |
|---|---|---|---|
| [TradingView Lightweight Charts](./charts/lightweight-charts) | `pnpm chart:lightweight` | `lightweight-charts.html` | Apache-2.0 |
| [Apache ECharts](./charts/echarts) | `pnpm chart:echarts` | `echarts.html` | Apache-2.0 |
| [Chart.js + chartjs-chart-financial](./charts/chartjs) | `pnpm chart:chartjs` | `chartjs.html` | MIT |
| [Plotly.js](./charts/plotly) | `pnpm chart:plotly` | `plotly.html` | MIT |
| [Highcharts Stock](./charts/highcharts-stock) | `pnpm chart:highcharts` | `highcharts-stock.html` | Commercial (free for non-commercial only) |

The shared candle-fetch + browser-open helpers live in [`charts/_shared/candles.ts`](./charts/_shared/candles.ts), so each `index.ts` is just the library-specific wiring.

## Other examples

| Script | Command | What it does |
|---|---|---|
| [`options_chain_monitor`](./options_chain_monitor) | `pnpm monitor` (or `pnpm monitor TSLA 10`) | Polls the next monthly options chain on an interval and renders a live `cli-table3` dashboard — calls on the left, puts on the right, strike in the middle — with colour-coded bid/ask/mid/last deltas. |
