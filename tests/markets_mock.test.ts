import { describe, expect, it } from "vitest";
import { MarketDataClient } from "@/client";
import { fetchMock } from "./setup";
import { createMockResponse, loadMock } from "./test-utils";

const mockData = loadMock("markets_status_response_200");
const mockHumanData = loadMock("markets_status_human_response_200");

describe("MarketsResource (Mock Data)", () => {
    it("status returns correct data structure from mock", async () => {
        const client = new MarketDataClient({ token: "test" });

        fetchMock.mockImplementation(async (url: string) => {
            if (url.includes("markets/status/")) {
                return createMockResponse({ json: mockData });
            }
            return createMockResponse({ ok: false, status: 404, text: "Not Found" });
        });

        const result = await client.markets.status();

        expect(Array.isArray(result)).toBe(true);
        expect((result as any[]).length).toBeGreaterThan(0);

        const first = (result as any[])[0];
        expect(first).not.toHaveProperty("s");
        expect(first).toHaveProperty("date");
        expect(first).toHaveProperty("status");
    });

    it("status returns correct human-readable data structure from mock", async () => {
        const client = new MarketDataClient({ token: "test" });

        fetchMock.mockImplementation(async (url: string) => {
            if (url.includes("/user/")) return createMockResponse();

            if (url.includes("markets/status/")) {
                return createMockResponse({ json: mockHumanData });
            }
            return createMockResponse({ ok: false, status: 404, text: "Not Found" });
        });

        const result = await client.markets.status({ useHumanReadable: true } as any);

        expect(Array.isArray(result)).toBe(true);
        expect((result as any[]).length).toBeGreaterThan(0);

        const first = (result as any[])[0];
        expect(first).not.toHaveProperty("s");
        expect(first).toHaveProperty("Date");
        expect(first).toHaveProperty("Status");
    });
});
