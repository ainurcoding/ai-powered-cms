import { Request, Response, NextFunction, RequestHandler } from 'express';
import { sendResponse, sendError } from './response';
import { AppException } from './exceptions';
import logger from './logger';

export type TRequestFunction = (
	req: Request,
	res: Response,
	next: NextFunction
) => Promise<any>;

export const requestHandler = (fn: TRequestFunction): RequestHandler => {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			const result = await fn(req, res, next);
			
			// If response already sent, don't send again
			if (res.headersSent) {
				return;
			}

			sendResponse(
				{
					message: result?.message || 'Success',
					result: result?.result !== undefined ? result.result : result,
					status: result?.status || 200
				},
				res
			);
		} catch (error) {
			if (error instanceof AppException) {
				sendError(error.message, error.statusCode, res);
			} else if (error instanceof Error) {
				logger.error(error.message, { stack: error.stack });
				sendError('Internal Server Error', 500, res);
			} else {
				logger.error('Unknown error', error);
				sendError('Internal Server Error', 500, res);
			}
		}
	};
};

