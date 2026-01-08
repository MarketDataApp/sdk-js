import { REFRESH_API_STATUS_INTERVAL_MS } from "@/internalSettings";
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

export class ApiStatusManager {
	private data: StatusData | null = null;
	private refreshPromise: Promise<boolean> | null = null;

	public async getApiStatus(
		client: IMarketDataClient,
		service: string,
	): Promise<APIStatusResult> {
		if (this.shouldRefresh) {
			await this.refresh(client);
		}

		if (!this.data?.service) return APIStatusResult.UNKNOWN;

		const index = this.data.service.indexOf(service);
		if (index === -1) {
			client.logger.error(`Service ${service} not found in API status`);
			return APIStatusResult.UNKNOWN;
		}

		if (
			this.data.status[index] !== APIStatusResult.ONLINE ||
			!this.data.online[index]
		) {
			client.logger.error(`Service ${service} is offline`);
			return APIStatusResult.OFFLINE;
		}

		return APIStatusResult.ONLINE;
	}

	public get lastUpdated(): number {
		if (!this.data?.updated?.length) return 0;
		return Math.min(...this.data.updated) * 1000;
	}

	public async refresh(client: IMarketDataClient): Promise<boolean> {
		if (this.refreshPromise) return this.refreshPromise;

		this.refreshPromise = (async () => {
			try {
				this.data = await client._makeRequest<StatusData>(
					"status/",
					undefined,
					{
						includeApiVersion: false,
						skipRateLimitCheck: true,
						skipRetry: true,
					},
				);
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
		return Date.now() - this.lastUpdated > REFRESH_API_STATUS_INTERVAL_MS;
	}
}

export const globalApiStatus = new ApiStatusManager();
