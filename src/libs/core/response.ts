import { Response } from 'express';

export interface IApiResponse {
	message?: string;
	result?: any;
	status?: number;
}

export const sendResponse = (data: IApiResponse, res: Response) => {
	const statusCode = data.status || 200;
	const message = data.message || 'Success';
	const result = data.result !== undefined ? data.result : null;

	return res.status(statusCode).json({
		message,
		result
	});
};

export const sendError = (message: string, statusCode: number, res: Response) => {
	return res.status(statusCode).json({
		message,
		result: null
	});
};

