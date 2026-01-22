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
	setLogLevel(level: LogLevel): void;
}

export class DefaultLogger implements Logger {
	constructor(private level: LogLevel = LogLevel.INFO) {}

	public debug(message: string): void {
		if (this.level <= LogLevel.DEBUG)
			console.debug(`[${new Date().toISOString()}] [DEBUG] ${message}`);
	}

	public error(message: string): void {
		if (this.level <= LogLevel.ERROR)
			console.error(`[${new Date().toISOString()}] [ERROR] ${message}`);
	}

	public info(message: string): void {
		if (this.level <= LogLevel.INFO)
			console.info(`[${new Date().toISOString()}] [INFO] ${message}`);
	}

	public setLogLevel(level: LogLevel): void {
		this.level = level;
	}

	public warn(message: string): void {
		if (this.level <= LogLevel.WARN)
			console.warn(`[${new Date().toISOString()}] [WARN] ${message}`);
	}
}
