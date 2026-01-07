import { describe, expect, it } from "vitest";
import { MarketDataClient } from "@/client";
import { fetchMock } from "./setup";

describe("MarketsResource", () => {

    it("fetches market status with correct params", async () => {
        const client = new MarketDataClient({ token: "test-token" });

        fetchMock.mockImplementation((url: string) => {
            if (url.includes("markets/status/")) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        s: "ok",
                        date: [1700000000],
                        status: ["open"],
                    }),
                    headers: new Headers(),
                });
            }
            return Promise.resolve({
                ok: false,
                status: 404,
                headers: new Headers(),
            });
        });

        const result = await client.markets.status({ country: "US" });

        expect(fetchMock).toHaveBeenCalledTimes(2);
        const url = new URL(fetchMock.mock.calls[1][0]);

        expect(url.pathname).toContain("/v1/markets/status/");
        expect(url.searchParams.get("country")).toBe("US");

        expect(result as any[]).toEqual([
            {
                date: 1700000000,
                status: "open",
            },
        ]);
    });

    it("fetches human-readable market status", async () => {
        const client = new MarketDataClient({ token: "test-token" });

        fetchMock.mockImplementation((url: string) => {
            if (url.includes("/user/")) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({}),
                    headers: new Headers(),
                });
            }
            if (url.includes("markets/status/")) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        s: "ok",
                        Date: [1699920000],
                        Status: ["open"],
                    }),
                    headers: new Headers(),
                });
            }
            return Promise.resolve({
                ok: false,
                status: 404,
                headers: new Headers(),
            });
        });

        const result = await client.markets.status({ useHumanReadable: true } as any);

        expect(result as any[]).toEqual([
            {
                Date: 1699920000,
                Status: "open",
            },
        ]);
    });
});
