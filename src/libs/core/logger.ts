import winston from 'winston';
import { NODE_ENV } from '../config';

const logFormat = winston.format.combine(
	winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
	winston.format.errors({ stack: true }),
	winston.format.splat(),
	winston.format.json()
);

const consoleFormat = winston.format.combine(
	winston.format.colorize(),
	winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
	winston.format.printf(({ timestamp, level, message, ...meta }) => {
		let msg = `${timestamp} [${level}]: ${message}`;
		if (Object.keys(meta).length > 0 && meta.stack) {
			msg += `\n${meta.stack}`;
		} else if (Object.keys(meta).length > 0) {
			msg += `\n${JSON.stringify(meta, null, 2)}`;
		}
		return msg;
	})
);

const logger = winston.createLogger({
	level: NODE_ENV === 'production' ? 'info' : 'debug',
	format: logFormat,
	transports: [
		new winston.transports.Console({
			format: consoleFormat
		}),
		new winston.transports.File({
			filename: 'storage/logs/error.log',
			level: 'error',
			maxsize: 5242880, // 5MB
			maxFiles: 5
		}),
		new winston.transports.File({
			filename: 'storage/logs/combined.log',
			maxsize: 5242880, // 5MB
			maxFiles: 5
		})
	]
});

export const dump = (data: any) => {
	if (NODE_ENV === 'production') {
		logger.error(data);
	} else {
		// eslint-disable-next-line no-console
		console.log(data);
	}
};

export default logger;

