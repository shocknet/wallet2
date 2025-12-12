import { IdentityType } from "@/State/identitiesRegistry/types";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Device, DeviceInfo } from '@capacitor/device';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
const MAX_ENTRIES = 500;




interface IdentityContext {
	identityPubkey: string;
	identityType: IdentityType;
}


interface LogFields {
	message?: string;
	data?: Record<string, unknown>;
	error?: unknown;
	tags?: string[];
	context?: LoggerContext;
}

interface LogEntry extends LogFields, Partial<IdentityContext> {
	sessionId: string;
	createdAt: string;
	level: LogLevel;
	event: string;
}

interface SerializedError {
	name: string;
	message: string;
	stack?: string;
}


interface AppBuildInfo {
	appId: string;
	versionName: string;
	versionCode: string;
	env: string;
	platform: string;
}

interface DebugReport {
	createdAt: string;
	buildInfo: AppBuildInfo;
	deviceId: string;
	deviceInfo: DeviceInfo;
	entries: LogEntry[];
}

interface DebugLogger {
	setIdentityContext(ctx: IdentityContext): void;
	removeIdentityContext(): void;

	log(level: LogLevel, event: string, fields?: LogFields): void;
	debug(event: string, fields?: LogFields): void;
	info(event: string, fields?: LogFields): void;
	warn(event: string, fields?: LogFields): void;
	error(event: string, fields?: LogFields): void;

	withContext(ctx: LoggerContext): ScopedDebugLogger;

	buildDebugReport(): Promise<string>;
}

interface ScopedDebugLogger {
	log(level: LogLevel, event: string, fields?: LogFields): void;
	debug(event: string, fields?: LogFields): void;
	info(event: string, fields?: LogFields): void;
	warn(event: string, fields?: LogFields): void;
	error(event: string, fields?: LogFields): void;
}

interface LoggerContext {
	procedure?: string;
	component?: string;
	data?: Record<string, unknown>;
	contextId?: string;
}



function createDebugLogger(): DebugLogger {
	let identityContext: IdentityContext | undefined = undefined; // info about the active identity

	const sessionId = generateId(); // unique id per app launch, in case we move to persisted debug logs later

	const printToConsole = import.meta.env.MODE === "development";

	const entries: LogEntry[] = [];

	function pushEntry(entry: LogEntry) {
		entries.push(entry);
		if (entries.length > MAX_ENTRIES) {
			entries.shift();
		}

		if (printToConsole) {
			const prefix = `[${entry.createdAt}][${entry.level.toUpperCase()}][${entry.event
				}]`;

			console[mapLevelToConsoleMethod(entry.level)](prefix, entry);
		}
	}

	function log(level: LogLevel, event: string, fields?: LogFields) {
		const entry: LogEntry = {
			context: fields?.context,
			data: fields?.data,
			sessionId,
			createdAt: new Date().toISOString(),
			level,
			event,
			message: fields?.message,
			identityPubkey: identityContext?.identityPubkey,
			identityType: identityContext?.identityType,
			tags: fields?.tags,
			error: serializeError(fields?.error),
		};

		pushEntry(entry);
	}




	function createScopedLogger(ctx: LoggerContext): ScopedDebugLogger {

		const contextId = generateId();

		function wrapFields(fields?: LogFields): LogFields {
			return {
				...fields,
				context: { ...ctx, contextId },
			};
		}

		return {
			log(level, event, fields) {
				const merged = wrapFields(fields);
				log(level, event, merged);
			},
			debug(event, fields) {
				this.log('debug', event, fields);
			},
			info(event, fields) {
				this.log('info', event, fields);
			},
			warn(event, fields) {
				this.log('warn', event, fields);
			},
			error(event, fields) {
				this.log('error', event, fields);
			},
		};
	}

	const logger: DebugLogger = {
		setIdentityContext(ctx) {
			identityContext = ctx;
		},

		removeIdentityContext() {
			identityContext = undefined;
		},

		log,

		debug(event, fields) {
			log('debug', event, fields);
		},

		info(event, fields) {
			log('info', event, fields);
		},

		warn(event, fields) {
			log('warn', event, fields);
		},

		error(event, fields) {
			log('error', event, fields);
		},

		withContext(ctx) {
			return createScopedLogger(ctx);
		},

		async buildDebugReport() {
			let versionCode = "";
			let versionName = "";
			let appId = "";

			if (Capacitor.isNativePlatform()) {
				const res = await App.getInfo();
				appId = res.id;
				versionCode = res.build;
				versionName = res.version;
			} else {
				appId = "web-build";
				versionCode = __WEB_APP_VERSION_CODE__;
				versionName = __WEB_APP_VERSION__;
			}


			const env = import.meta.env.MODE;
			const platform = Capacitor.getPlatform();

			const { identifier: deviceId } = await Device.getId();
			const deviceInfo = await Device.getInfo();

			const report: DebugReport = {
				createdAt: new Date().toISOString(),
				buildInfo: {
					appId,
					versionCode,
					versionName,
					platform,
					env,
				},
				deviceId,
				deviceInfo: deviceInfo,

				entries: [...entries],
			};

			return JSON.stringify(report, undefined, 4);
		}
	};

	return logger;
}








function generateId(prefix: string = 'sess'): string {
	const timePart = Date.now().toString(36);              // e.g. 'lrv5po9'
	const randPart = Math.random().toString(36).slice(2, 8); // e.g. 'a9k3fz'
	return `${prefix}_${timePart}_${randPart}`;
}


function serializeError(error: unknown): SerializedError | undefined {
	if (!error) return undefined;

	if (error instanceof Error) {
		return {
			name: error.name,
			message: error.message,
			stack: error.stack,
		};
	}


	if (typeof error === 'string') {
		return {
			name: 'Error',
			message: error,
		};
	}

	try {
		return {
			name: 'NonError',
			message: JSON.stringify(error),
		};
	} catch {
		return {
			name: 'NonError',
			message: String(error),
		};
	}
}

function mapLevelToConsoleMethod(level: LogLevel): 'log' | 'info' | 'warn' | 'error' {
	switch (level) {
		case 'debug':
			return 'log';
		case 'info':
			return 'info';
		case 'warn':
			return 'warn';
		case 'error':
			return 'error';
	}
}

const dLogger = createDebugLogger();
export default dLogger;
