export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
}

export interface Logger {
    debug(message: string): void;
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
}

export class DefaultLogger implements Logger {
    constructor(private level: LogLevel = LogLevel.INFO) { }

    public debug(message: string): void {
        if (this.level <= LogLevel.DEBUG) console.debug(`[DEBUG] ${message}`);
    }

    public info(message: string): void {
        if (this.level <= LogLevel.INFO) console.info(`[INFO] ${message}`);
    }

    public warn(message: string): void {
        if (this.level <= LogLevel.WARN) console.warn(`[WARN] ${message}`);
    }

    public error(message: string): void {
        if (this.level <= LogLevel.ERROR) console.error(`[ERROR] ${message}`);
    }
}
