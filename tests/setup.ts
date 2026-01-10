import { beforeEach, type Mock, vi } from "vitest";
import { createMockResponse } from "./test-utils";

const fetchMock: Mock = vi.fn();
global.fetch = fetchMock;

beforeEach(() => {
	fetchMock.mockClear();
	fetchMock.mockImplementation(async (url: string) => {
		if (url.includes("/user/")) {
			return createMockResponse({
				json: {},
				headers: {
					"x-api-ratelimit-limit": "100",
					"x-api-ratelimit-remaining": "100",
					"x-api-ratelimit-reset": "0",
					"x-api-ratelimit-consumed": "0",
				},
			});
		}

		if (url.includes("/status/")) {
			const _time = Math.floor(Date.now() / 1000);
			return createMockResponse({
				json: {
					service: [
						"/v1/markets/status/",
						"/v1/stocks/prices/",
						"/v1/stocks/candles/",
					],
					status: ["online", "online", "online"],
					online: [true, true, true],
					uptimePct30d: [100, 100],
					uptimePct90d: [100, 100],
					updated: [_time, _time],
				},
			});
		}

		return createMockResponse({
			ok: false,
			status: 404,
			text: "Not Found",
		});
	});
});

export { fetchMock };
