import { VALID_STATUS_CODES } from "@/internalSettings";
import type { IMarketDataClient } from "@/types";

export enum APIStatusResult {
	ONLINE = "online",
	OFFLINE = "offline",
	UNKNOWN = "unknown",
}

export interface StatusData {
	service: string[];
	status: string[];
	online: boolean[];
	uptimePct30d: number[];
	uptimePct90d: number[];
	updated: number[];
}

const REFRESH_INTERVAL_MS = 4.5 * 60 * 1000;
const STATUS_FETCH_TIMEOUT_MS = 10000;

export class ApiStatusManager {
	private data: StatusData | null = null;
	private readonly refreshInterval = REFRESH_INTERVAL_MS;

	public get lastUpdated(): number {
		if (!this.data?.updated?.length) {
			return 0;
		}
		return Math.min(...this.data.updated) * 1000;
	}

	public get shouldRefresh(): boolean {
		return Date.now() - this.lastUpdated > this.refreshInterval;
	}

	public async getApiStatus(
		client: IMarketDataClient,
		service: string,
	): Promise<APIStatusResult> {
		if (this.shouldRefresh) {
			await this.refresh(client);
		}

		if (!this.data || !this.data.service) return APIStatusResult.UNKNOWN;

		const index = this.data.service.indexOf(service);
		if (index === -1) return APIStatusResult.UNKNOWN;

		if (this.data.status[index] !== APIStatusResult.ONLINE)
			return APIStatusResult.OFFLINE;
		if (!this.data.online[index]) return APIStatusResult.OFFLINE;

		return APIStatusResult.ONLINE;
	}

	public async refresh(client: IMarketDataClient): Promise<boolean> {
		try {
			const controller = new AbortController();
			const timeout = setTimeout(
				() => controller.abort(),
				STATUS_FETCH_TIMEOUT_MS,
			);

			const response = await fetch(`${client.baseUrl}/status/`, {
				signal: controller.signal,
			});
			clearTimeout(timeout);

			if (!VALID_STATUS_CODES.includes(response.status)) {
				return false;
			}

			this.data = (await response.json()) as StatusData;
			return true;
		} catch {
			return false;
		}
	}
}

export const globalApiStatus = new ApiStatusManager();
