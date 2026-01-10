import {
	Endpoints,
	REFRESH_API_STATUS_INTERVAL_MS,
	Service,
} from "@/internalSettings";
import type { IMarketDataClient, MarketDataResult } from "@/types";

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
			const result: MarketDataResult<StatusData> =
				client._makeRequest<StatusData>(Endpoints.API_STATUS, undefined, {
					includeApiVersion: false,
					skipRateLimitCheck: true,
					skipRetry: true,
					service: Service.STATUS,
				});

			const res = await result;

			if (res.isOk()) {
				this.data = res.value;
				this.failureTimestamp = 0;
				this.refreshPromise = null;
				return true;
			}

			this.data = null;
			this.failureTimestamp = Date.now();
			client.logger.error(`Failed to refresh API status: ${res.error.message}`);
			this.refreshPromise = null;
			return false;
		})();

		return this.refreshPromise;
	}

	public get shouldRefresh(): boolean {
		if (this.refreshPromise) return false;

		const now = Date.now();
		if (now - this.failureTimestamp < 30000) return false;

		return now - this.lastUpdated > REFRESH_API_STATUS_INTERVAL_MS;
	}

	private data: StatusData | null = null;

	private failureTimestamp = 0;

	private refreshPromise: Promise<boolean> | null = null;
}

export const globalApiStatus = new ApiStatusManager();
