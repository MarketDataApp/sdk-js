import { describe, expect, it } from "vitest";
import { MarketDataClient } from "@/client";
import { fetchMock } from "./setup";
import { createMockResponse, unwrapOk } from "./test-utils";

describe("MarketsResource", () => {

    it("fetches market status with correct params", async () => {
        const client = new MarketDataClient({ token: "test-token" });

        fetchMock.mockImplementation(async (url: string) => {
            if (url.includes("/user/")) return createMockResponse();
            if (url.includes("/v1/markets/status/")) {
                return createMockResponse({
                    json: {
                        s: "ok",
                        date: [1700000000],
                        status: ["open"],
                    },
                });
            }
            return createMockResponse({ ok: false, status: 404, text: "Not Found" });
        });

        const result = unwrapOk(await client.markets.status({ country: "US" }));

        expect(fetchMock).toHaveBeenCalledTimes(2);
        const url = new URL(fetchMock.mock.calls[1][0]);

        expect(url.pathname).toContain("/v1/markets/status/");
        expect(url.searchParams.get("country")).toBe("US");

        expect(result).toEqual([
            {
                date: 1700000000,
                status: "open",
            },
        ]);
    });

    it("fetches human-readable market status", async () => {
        const client = new MarketDataClient({ token: "test-token" });

        fetchMock.mockImplementation(async (url: string) => {
            if (url.includes("/user/")) return createMockResponse();

            if (url.includes("/v1/markets/status/")) {
                return createMockResponse({
                    json: {
                        s: "ok",
                        Date: [1699920000],
                        Status: ["open"],
                    },
                });
            }
            return createMockResponse({ ok: false, status: 404, text: "Not Found" });
        });

        const result = unwrapOk(await client.markets.status({ useHumanReadable: true }));

        expect(result).toEqual([
            {
                Date: 1699920000,
                Status: "open",
            },
        ]);
    });
});
