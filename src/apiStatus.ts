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
    private lastUpdated = 0;
    private readonly refreshInterval = 4.5 * 60 * 1000; // 4.5 minutes in ms

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

        if (!this.data) return APIStatusResult.UNKNOWN;

        const index = this.data.service.indexOf(service);
        if (index === -1) return APIStatusResult.UNKNOWN;

        if (this.data.status[index] !== APIStatusResult.ONLINE)
            return APIStatusResult.OFFLINE;
        if (!this.data.online[index]) return APIStatusResult.OFFLINE;

        return APIStatusResult.ONLINE;
    }

    public async refresh(client: IMarketDataClient): Promise<boolean> {
        try {
            // This call should not check rate limits or update them to avoid recursion
            // It should also not use the standard retry logic if possible, or use a simplified one
            const response = await fetch(`${client.baseUrl}/status/`);
            if (!response.ok) return false;

            this.data = (await response.json()) as StatusData;
            this.lastUpdated = Date.now();
            return true;
        } catch {
            return false;
        }
    }
}

export const globalApiStatus = new ApiStatusManager();
