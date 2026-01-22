import { describe, expect, it } from "vitest";
import { formatDate, formatValue, getDataRecords } from "@/utils";

describe("utils", () => {
    describe("formatDate", () => {
        it("formats Date objects correctly", () => {
            const date = new Date("2023-01-01T12:00:00Z");
            // formatDate returns YYYY-MM-DD
            expect(formatDate(date)).toBe("2023-01-01");
        });

        it("formats ISO strings correctly", () => {
            expect(formatDate("2023-01-01")).toBe("2023-01-01");
            expect(formatDate("2023-01-01T15:30:00")).toBe("2023-01-01");
        });

        it("returns random strings as is", () => {
            expect(formatDate("not-a-date")).toBe("not-a-date");
        });

        it("formats Unix timestamps correctly", () => {
            // 1672531200 = 2023-01-01 00:00:00 UTC
            expect(formatDate(1672531200)).toBe("2023-01-01");
        });

        it("formats Excel serial dates correctly", () => {
            // 44927 = 2023-01-01 approx (depending on leap year logic, Python says 0 < val < 60000)
            // 1899-12-30 + 10 = 1900-01-09
            expect(formatDate(10)).toBe("1900-01-09");
            expect(formatDate(44927)).toBe("2023-01-01");
        });
    });

    describe("formatValue", () => {
        it("formats booleans to lowercase string", () => {
            expect(formatValue(true)).toBe("true");
            expect(formatValue(false)).toBe("false");
        });

        it("formats arrays as comma-separated strings", () => {
            expect(formatValue(["a", "b"])).toBe("a,b");
            expect(formatValue([1, 2])).toBe("1,2");
        });

        it("formats dates within arrays", () => {
            const d1 = new Date("2023-01-01");
            const d2 = new Date("2023-01-02");
            expect(formatValue([d1, d2])).toBe("2023-01-01,2023-01-02");
        });

        it("returns undefined for null/undefined", () => {
            expect(formatValue(null)).toBeUndefined();
            expect(formatValue(undefined)).toBeUndefined();
        });
    });

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

            expect(getDataRecords(input)).toEqual(expected);
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
});
