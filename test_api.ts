import { MarketDataClient } from "./src";

async function main() {
    console.log("=".repeat(60));
    console.log("MarketData SDK - Real API Test Suite");
    console.log("=".repeat(60));
    console.log();

    const sdk = new MarketDataClient({ debug: true });

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
        expiration: "ALL",
        human: true,
    });
    let optionSymbol = "";
    if (optionsChain.isErr()) {
        console.error("❌ Error:", optionsChain.error.message);
    } else {
        const data = optionsChain.value;
        console.log("✓ Success! Got", data.length, "option(s)");
        if (data.length > 0) {
            console.log("First option:", data[0]);

            // Find first unexpired option (Days_To_Expiration > 0)
            const unexpiredOption = data.find((opt: any) => opt.Days_To_Expiration > 0);
            if (unexpiredOption) {
                console.log("Selected unexpired option:", unexpiredOption.Symbol);
                optionSymbol = unexpiredOption.Symbol;
            } else {
                console.log("⚠️ No unexpired option found in chain, using first available (Test 14 might fail)");
                optionSymbol = data[0].Symbol;
            }
        }
    }
    console.log();

    // Test 8: Stock Quotes (Bulk)
    testLabel("Test 8: Stock Quotes (Bulk, Human Format)");
    const stockQuotes = await sdk.stocks.quotes(["AAPL", "MSFT"], {
        human: true,
    });
    if (stockQuotes.isErr()) {
        console.error("❌ Error:", stockQuotes.error.message);
    } else {
        const data = stockQuotes.value;
        console.log("✓ Success! Got", data.length, "quote(s)");
        if (data.length > 0) console.log("First quote:", data[0]);
    }
    console.log();

    // Test 9: Stock Earnings
    testLabel("Test 9: Stock Earnings (AAPL, Human Format)");
    const stockEarnings = await sdk.stocks.earnings("AAPL", {
        human: true,
    });
    if (stockEarnings.isErr()) {
        console.error("❌ Error:", stockEarnings.error.message);
    } else {
        const data = stockEarnings.value;
        console.log("✓ Success! Got", data.length, "earning(s)");
        if (data.length > 0) console.log("First earning:", data[0]);
    }
    console.log();

    // Test 10: Stock News
    testLabel("Test 10: Stock News (AAPL, Human Format)");
    const stockNews = await sdk.stocks.news("AAPL", {
        human: true,
    });
    if (stockNews.isErr()) {
        console.error("❌ Error:", stockNews.error.message);
    } else {
        const data = stockNews.value;
        console.log("✓ Success! Got", data.length, "news item(s)");
        if (data.length > 0) console.log("First news:", data[0]);
    }
    console.log();

    // Test 11: Options Expirations
    testLabel("Test 11: Options Expirations (AAPL, Human Format)");
    const optionsExpirations = await sdk.options.expirations("AAPL", {
        human: true,
    });
    if (optionsExpirations.isErr()) {
        console.error("❌ Error:", optionsExpirations.error.message);
    } else {
        const data = optionsExpirations.value as any;
        const count = data.Expirations ? data.Expirations.length : 0;
        console.log("✓ Success! Got", count, "expiration(s)");
        if (count > 0) console.log("First expiration:", data.Expirations[0]);
    }
    console.log();

    // Test 12: Options Strikes
    testLabel("Test 12: Options Strikes (AAPL, Human Format)");
    const optionsStrikes = await sdk.options.strikes("AAPL", {
        human: true,
    });
    if (optionsStrikes.isErr()) {
        console.error("❌ Error:", optionsStrikes.error.message);
    } else {
        const data = optionsStrikes.value as any;
        const keys = Object.keys(data).filter(k => k !== 's' && k !== 'updated' && k !== 'Date');
        console.log("✓ Success! Got strikes for", keys.length, "expiration date(s)");
        if (keys.length > 0) console.log(`First date (${keys[0]}) strikes:`, data[keys[0]].slice(0, 5), "...");
    }
    console.log();

    // Test 13: Options Lookup
    testLabel("Test 13: Options Lookup (AAPL, Human Format)");
    const optionsLookup = await sdk.options.lookup("AAPL 7/28/2023 200 Call", {
        human: true,
    });
    if (optionsLookup.isErr()) {
        console.error("❌ Error:", optionsLookup.error.message);
    } else {
        const data = optionsLookup.value as any;
        console.log("✓ Success! Found symbol:", data.Symbol);
    }
    console.log();

    // Test 14: Options Quotes
    testLabel("Test 14: Options Quotes (Specific Option, Human Format)");
    if (optionSymbol) {
        console.log("Testing with option symbol:", optionSymbol);
        const optionsQuotes = await sdk.options.quotes(optionSymbol, {
            human: true,
        });
        if (optionsQuotes.isErr()) {
            console.error("❌ Error:", optionsQuotes.error.message);
        } else {
            const data = optionsQuotes.value;
            console.log("✓ Success! Got", data.length, "quote(s)");
            if (data.length > 0) console.log("First quote:", data[0]);
        }
    } else {
        console.log("⚠️ Skipping Test 14 - No option symbol available from Test 7");
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
