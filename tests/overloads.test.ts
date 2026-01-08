import { describe, expect, it, vi, beforeEach } from "vitest";
import { MarketDataClient } from "@/client";

describe("Method Overloads", () => {
    let client: MarketDataClient;
    let makeRequestSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        client = new MarketDataClient({ token: "test-token" });
        makeRequestSpy = vi.fn().mockResolvedValue({});
        client._makeRequest = makeRequestSpy as any;
    });

    describe("stocks.candles", () => {
        it("accepts positional symbol", async () => {
            await client.stocks.candles("AAPL", { resolution: "D" });
            const args = makeRequestSpy.mock.calls[0];
            expect(args[0]).toMatch(/stocks\/candles\/D\/AAPL\/?/);
            expect(args[1]).toEqual(expect.not.objectContaining({ symbol: "AAPL", resolution: "D" }));
        });

        it("accepts params object", async () => {
            await client.stocks.candles({ symbol: "MSFT", resolution: "60" });
            const args = makeRequestSpy.mock.calls[0];
            expect(args[0]).toMatch(/stocks\/candles\/60\/MSFT\/?/);
            expect(args[1]).toEqual(expect.not.objectContaining({ symbol: "MSFT", resolution: "60" }));
        });
    });

    describe("stocks.prices", () => {
        it("accepts positional single symbol string", async () => {
            await client.stocks.prices("AAPL");
            const args = makeRequestSpy.mock.calls[0];
            expect(args[0]).toBe("stocks/prices/");
            expect(args[1]).toEqual(expect.objectContaining({ symbols: "AAPL" }));
        });

        it("accepts positional array of symbols", async () => {
            await client.stocks.prices(["AAPL", "GOOG"]);
            const args = makeRequestSpy.mock.calls[0];
            expect(args[0]).toBe("stocks/prices/");
            expect(args[1]).toEqual(
                expect.objectContaining({ symbols: "AAPL,GOOG" }),
            );
        });

        it("accepts params object with string symbol", async () => {
            await client.stocks.prices({ symbols: "MSFT" });
            const args = makeRequestSpy.mock.calls[0];
            expect(args[0]).toBe("stocks/prices/");
            expect(args[1]).toEqual(expect.objectContaining({ symbols: "MSFT" }));
        });
    });
});
