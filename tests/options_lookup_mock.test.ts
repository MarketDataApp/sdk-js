import { MarketDataClient } from "@/client";
import { describe, expect, test } from "vitest";
import { fetchMock } from "./setup";
import { createMockResponse, loadMock } from "./test-utils";

describe("Options Lookup Mocks", () => {
    test("lookup", async () => {
        const mockData = loadMock("options_lookup_response_200");
        fetchMock.mockImplementation(async (url: string) => {
            if (url.includes("options/lookup/AAPL/")) {
                return createMockResponse({ json: mockData });
            }
            return createMockResponse({ ok: false, status: 404, text: "Not Found" });
        });

        const client = new MarketDataClient({
            token: "test",
        });

        const result = await client.options.lookup("AAPL");
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect((result.value as any).s).toBe("ok");
            expect((result.value as any).optionSymbol).toBe("AAPL230728C00200000");
        }
    });

    test("lookup human readable", async () => {
        const mockData = loadMock("options_lookup_human_response_200");
        fetchMock.mockImplementation(async (url: string) => {
            if (url.includes("options/lookup/AAPL/")) {
                return createMockResponse({ json: mockData });
            }
            return createMockResponse({ ok: false, status: 404, text: "Not Found" });
        });

        const client = new MarketDataClient({
            token: "test",
        });

        const result = await client.options.lookup("AAPL", {
            human: true,
        });
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect((result.value as any).Symbol).toBe("AAPL230728C00200000");
        }
    });
});
