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

	private _log(
		level: string,
		message: string,
		method: "debug" | "info" | "warn" | "error",
	): void {
		const timestamp = new Date().toISOString().replace("T", " ").split(".")[0];
		// Python format: %(asctime)s - %(name)s - %(levelname)s - %(message)s
		console[method](`${timestamp} - marketdata - ${level} - ${message}`);
	}

	public debug(message: string): void {
		if (this.level <= LogLevel.DEBUG) this._log("DEBUG", message, "debug");
	}

	public error(message: string): void {
		if (this.level <= LogLevel.ERROR) this._log("ERROR", message, "error");
	}

	public info(message: string): void {
		if (this.level <= LogLevel.INFO) this._log("INFO", message, "info");
	}

	public setLogLevel(level: LogLevel): void {
		this.level = level;
	}

	public warn(message: string): void {
		if (this.level <= LogLevel.WARN) this._log("WARNING", message, "warn");
	}
}
