import { MarketDataClient } from "./src";

async function main() {
    console.log("=".repeat(60));
    console.log("MarketData SDK - Real API Test Suite");
    console.log("=".repeat(60));
    console.log();

    const sdk = new MarketDataClient({ debug: false });

    console.log("SDK Configuration:");
    console.log(`  Base URL: ${sdk.baseUrl}`);
    console.log(`  API Version: ${sdk.apiVersion}`);
    console.log(`  Token: ${sdk.token ? `***${sdk.token.slice(-4)}` : "NONE"}`);
    console.log();

    const testLabel = (title: string) => {
        console.log("─".repeat(60));
        console.log(title);
        console.log("─".repeat(60));
    };

    // Test 1: Market Status
    testLabel("Test 1: Market Status (Machine Format)");
    const statusMachine = await sdk.markets.status({});
    if (statusMachine.isErr()) {
        console.error("❌ Error:", statusMachine.error.message);
    } else {
        const data = statusMachine.value;
        console.log("✓ Success! Got", data.length, "record(s)");
        if (data.length > 0) console.log("Data:", data[0]);
    }
    console.log();

    // Test 2: Market Status (Human)
    testLabel("Test 2: Market Status (Human Format)");
    const statusHuman = await sdk.markets.status({ human: true });
    if (statusHuman.isErr()) {
        console.error("❌ Error:", statusHuman.error.message);
    } else {
        const data = statusHuman.value;
        console.log("✓ Success! Got", data.length, "record(s)");
        if (data.length > 0) console.log("Data:", data[0]);
    }
    console.log();

    // Test 3: Stock Prices
    testLabel("Test 3: Stock Prices - Single Symbol (Machine Format)");
    const priceSingle = await sdk.stocks.prices("AAPL");
    if (priceSingle.isErr()) {
        console.error("❌ Error:", priceSingle.error.message);
    } else {
        const data = priceSingle.value;
        console.log("✓ Success! Got", data.length, "record(s)");
        if (data.length > 0) console.log("Data:", data[0]);
    }
    console.log();

    // Test 4: Stock Prices (Multiple, Human)
    testLabel("Test 4: Stock Prices - Multiple Symbols (Human Format)");
    const priceMultiple = await sdk.stocks.prices(["AAPL", "MSFT", "TSLA"], {
        useHumanReadable: true,
    });
    if (priceMultiple.isErr()) {
        console.error("❌ Error:", priceMultiple.error.message);
    } else {
        const data = priceMultiple.value;
        console.log("✓ Success! Got", data.length, "record(s)");
        console.log("First 3 records:");
        data.slice(0, 3).forEach((record: Record<string, any>, i: number) => {
            console.log(
                `  ${i + 1}. ${record.Symbol}: $${record.Mid} (${record["Change %"] > 0 ? "+" : ""}${record["Change %"]}%)`,
            );
        });
    }
    console.log();

    // Test 5: Candles
    testLabel("Test 5: Stock Candles (Daily, Human Format)");
    const candles = await sdk.stocks.candles("AAPL", {
        resolution: "D",
        from: "2023-01-01",
        to: "2023-01-10",
        human: true,
    });
    if (candles.isErr()) {
        console.error("❌ Error:", candles.error.message);
    } else {
        const data = candles.value;
        console.log("✓ Success! Got", data.length, "candle(s)");
        if (data.length > 0) console.log("First candle:", data[0]);
    }
    console.log();

    // Test 6: Fund Candles
    testLabel("Test 6: Fund Candles (Daily, Human Format)");
    const fundCandles = await sdk.funds.candles("VMFXX", {
        resolution: "D",
        from: "2025-12-01",
        to: "2025-12-10",
        human: true,
    });
    if (fundCandles.isErr()) {
        console.error("❌ Error:", fundCandles.error.message);
    } else {
        const data = fundCandles.value;
        console.log("✓ Success! Got", data.length, "candle(s)");
        if (data.length > 0) console.log("First candle:", data[0]);
    }
    console.log();

    // Test 7: Options Chain
    testLabel("Test 7: Options Chain (AAPL, Human Format)");
    const optionsChain = await sdk.options.chain("AAPL", {
        expiration: "ALL"
    });
    console.log(optionsChain);
    if (optionsChain.isErr()) {
        console.error("❌ Error:", optionsChain.error.message);
    } else {
        const data = optionsChain.value;
        console.log("✓ Success! Got", data.length, "option(s)");
        if (data.length > 0) {
            console.log("First option:", data[0]);
        }
    }
    console.log();

    console.log("=".repeat(60));
    console.log("Test Suite Complete");
    console.log("=".repeat(60));
    console.log();

    if (sdk.rateLimits) {
        console.log("Rate Limits:");
        console.log(`  Remaining: ${sdk.rateLimits.requestsRemaining}/${sdk.rateLimits.requestsLimit}`);
        console.log(`  Reset: ${new Date(sdk.rateLimits.requestsReset * 1000).toLocaleTimeString()}`);
    }
}

main().catch((error) => {
    console.error("\n❌ Fatal Error:", error);
    process.exit(1);
});
