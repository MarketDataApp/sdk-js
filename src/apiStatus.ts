import {
	REFRESH_API_STATUS_INTERVAL_MS,
	STATUS_FETCH_TIMEOUT_MS,
	VALID_STATUS_CODES,
} from "@/internalSettings";
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

const REFRESH_INTERVAL_MS = REFRESH_API_STATUS_INTERVAL_MS;

export class ApiStatusManager {
	private data: StatusData | null = null;
	private readonly refreshInterval = REFRESH_INTERVAL_MS;
	private refreshPromise: Promise<boolean> | null = null;

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

	public get lastUpdated(): number {
		if (!this.data?.updated?.length) {
			return 0;
		}
		return Math.min(...this.data.updated) * 1000;
	}

	public async refresh(client: IMarketDataClient): Promise<boolean> {
		if (this.refreshPromise) return this.refreshPromise;

		this.refreshPromise = (async () => {
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
					client.logger.error(
						`API status check failed with status: ${response.status}`,
					);
					return false;
				}

				this.data = (await response.json()) as StatusData;
				return true;
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				client.logger.error(`Failed to refresh API status: ${errorMessage}`);
				return false;
			} finally {
				this.refreshPromise = null;
			}
		})();

		return this.refreshPromise;
	}

	public get shouldRefresh(): boolean {
		return Date.now() - this.lastUpdated > this.refreshInterval;
	}
}

export const globalApiStatus = new ApiStatusManager();
