import { describe, expect, it } from "vitest";
import { getDataRecords } from "@/utils";

describe("getDataRecords", () => {
    it("transforms columnar data to array of objects", () => {
        const input = {
            symbol: ["AAPL", "MSFT"],
            price: [150, 250],
            ok: [true, true]
        };

        const expected = [
            { symbol: "AAPL", price: 150, ok: true },
            { symbol: "MSFT", price: 250, ok: true },
        ];

        expect(getDataRecords(input as any)).toEqual(expected);
    });

    it("handles empty input", () => {
        expect(getDataRecords({})).toEqual([]);
    });

    it("transforms mixed scalar and array data", () => {
        const input = {
            s: "ok",
            symbol: ["AAPL", "MSFT"],
            price: [150, 250],
        };

        const expected = [
            { s: "ok", symbol: "AAPL", price: 150 },
            { s: "ok", symbol: "MSFT", price: 250 },
        ];

        const result = getDataRecords(input);
        expect(result).toEqual(expected);
    });

    it("handles all scalars (length 1)", () => {
        const input = { s: "ok", count: 1 };
        expect(getDataRecords(input)).toEqual([{ s: "ok", count: 1 }]);
    });
});
