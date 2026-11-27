/**
 * API 3.0.0 added DELETE /v1/user/token/ — revokes the caller's own API
 * token. This asserts the wire shape of the new `utilities.deleteToken()`
 * method (DELETE verb, the versioned `/v1/user/token/` path), that it parses
 * a canned response body, and that a 404 surfaces as `NotFoundError` rather
 * than resolving as if the token had been revoked.
 */
import { describe, expect, it } from "vitest";
import { MarketDataClient } from "@/client";
import { NotFoundError } from "@/error";
import { fetchMock } from "./setup";
import { createMockResponse, loadMock } from "./test-utils";

const mockData = loadMock("user_delete_token_response_200");

describe("utilities.deleteToken", () => {
	it("sends a DELETE request to /v1/user/token/", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("/user/token/")) {
				return createMockResponse({ json: mockData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		const client = new MarketDataClient({
			token: "test-token",
			skipStartupValidation: true,
		});
		await client.utilities.deleteToken();

		const call = fetchMock.mock.calls.find((c) =>
			c[0]?.toString().includes("/user/token/"),
		);
		expect(call).toBeDefined();
		expect(new URL(call?.[0]?.toString() ?? "").pathname).toBe(
			"/v1/user/token/",
		);
		expect(call?.[1]?.method).toBe("DELETE");
	});

	it("parses the canned response body", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("/user/token/")) {
				return createMockResponse({ json: mockData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		const client = new MarketDataClient({
			token: "test-token",
			skipStartupValidation: true,
		});
		const result = await client.utilities.deleteToken();

		expect(result).toEqual(mockData);
	});

	it("rejects with NotFoundError on a 404, instead of resolving as if revoked", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("/user/token/")) {
				return createMockResponse({
					ok: false,
					status: 404,
					text: "Not Found",
				});
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		const client = new MarketDataClient({
			token: "test-token",
			skipStartupValidation: true,
		});

		await expect(client.utilities.deleteToken()).rejects.toBeInstanceOf(
			NotFoundError,
		);
	});
});
