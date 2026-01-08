import { type Mock, beforeEach, vi } from "vitest";

const fetchMock: Mock = vi.fn();
global.fetch = fetchMock;

beforeEach(() => {
    fetchMock.mockClear();
    fetchMock.mockImplementation((url: string) => {
        if (url.includes("/user/")) {
            return Promise.resolve({
                ok: true,
                json: async () => ({}),
                headers: new Headers({
                    "x-api-ratelimit-limit": "100",
                    "x-api-ratelimit-remaining": "100",
                    "x-api-ratelimit-reset": "0",
                    "x-api-ratelimit-consumed": "0",
                }),
            });
        }

        if (url.includes("/status/")) {
            const _time = Math.floor(Date.now() / 1000);
            return Promise.resolve({
                ok: true,
                json: async () => ({
                    service: [
                        "/v1/markets/status/",
                        "/v1/stocks/prices/",
                    ],
                    status: ["online", "online"],
                    online: [true, true],
                    uptimePct30d: [100, 100],
                    uptimePct90d: [100, 100],
                    updated: [_time, _time],
                }),
                headers: new Headers(),
            });
        }

        return Promise.resolve({
            ok: false,
            status: 404,
            text: async () => "Not Found",
            json: async () => ({}),
            headers: new Headers(),
        });
    });
});

export { fetchMock };
