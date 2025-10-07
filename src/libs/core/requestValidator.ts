import { Request, Response, NextFunction, RequestHandler } from 'express';
import { BaseSchema, safeParse } from 'valibot';
import { sendError } from './response';

interface IValidatorOptions {
	requestType: 'body' | 'query' | 'params';
	type: BaseSchema<any, any, any>;
}

export const requestValidator = (options: IValidatorOptions): RequestHandler => {
	return (req: Request, res: Response, next: NextFunction) => {
		const data = req[options.requestType];
		const result = safeParse(options.type, data);

		if (!result.success) {
			const errors = result.issues.map((issue) => issue.message).join(', ');
			sendError(errors, 400, res);
			return;
		}

		// Replace the data with validated data
		req[options.requestType] = result.output;
		next();
	};
};

