import { MarketDataClient } from "@/client";
import { describe, expect, test } from "vitest";
import { fetchMock } from "./setup";
import { createMockResponse, loadMock } from "./test-utils";

describe("Options Expirations Mocks", () => {
    test("expirations", async () => {
        const mockData = loadMock("options_expirations_response_200");
        fetchMock.mockImplementation(async (url: string) => {
            if (url.includes("options/expirations/AAPL/")) {
                return createMockResponse({ json: mockData });
            }
            return createMockResponse({ ok: false, status: 404, text: "Not Found" });
        });

        const client = new MarketDataClient({
            token: "test",
        });

        const result = await client.options.expirations("AAPL");
        expect(result.isOk()).toBe(true);

        if (result.isOk()) {
            expect(result.value.s).toBe("ok");
            expect(result.value.expirations).toHaveLength(22);
            expect(result.value.expirations[0]).toBe("2025-12-05");
        }
    });

    test("expirations human readable", async () => {
        const mockData = loadMock("options_expirations_human_response_200");
        fetchMock.mockImplementation(async (url: string) => {
            if (url.includes("options/expirations/AAPL/")) {
                return createMockResponse({ json: mockData });
            }
            return createMockResponse({ ok: false, status: 404, text: "Not Found" });
        });

        const client = new MarketDataClient({
            token: "test",
        });

        const result = await client.options.expirations("AAPL", {
            useHumanReadable: true,
        });
        expect(result.isOk()).toBe(true);

        if (result.isOk()) {
            expect(result.value.Expirations).toHaveLength(22);
            expect(result.value.Expirations[0]).toBe("2025-12-12");
        }
    });

    test("expirations input validation", async () => {
        const client = new MarketDataClient({ token: "test" });
        // @ts-expect-error Testing invalid input
        const result = await client.options.expirations("AAPL", { strike: "invalid" });
        expect(result.isErr()).toBe(true);
    });
});
