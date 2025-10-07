import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { sendError } from '@/libs/core/response';
import { APP_SECRET_KEY } from '@/libs/config';
import postgresConnection from '@/libs/config/postgresConnection';
import guestPath from '../config/guestPathHttp';

const authorizeMiddleware = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const isGuest = guestPath.some((routePath) => {
		let validPath = req.path === routePath.path;

		if (routePath.withSubPath) {
			validPath = req.path.startsWith(routePath.path);
		}

		let validMethod = true;
		if (routePath.method.length > 0) {
			validMethod = routePath.method.includes(req.method.toLowerCase() as any);
		}

		return validPath && validMethod;
	});

	if (isGuest) {
		next();
		return;
	}

	const tokenHeader = req.headers.authorization;
	if (!tokenHeader) {
		sendError('Authorization header missing or invalid token.', 401, res);
		return;
	}

	const token: string[] = tokenHeader.split(' ');
	
	if (token.length < 2 || token[0] !== 'Bearer' || !token[1]) {
		sendError('Invalid Token Format', 401, res);
		return;
	}

	try {
		const decode: any = jwt.verify(token[1], APP_SECRET_KEY);

		const user = await postgresConnection.queryOne<{
			id_user: number;
			nama: string;
			username: string;
			level: string;
		}>(
			'SELECT id_user, nama, username, level FROM users WHERE id_user = $1',
			[decode.id_user]
		);

		if (!user) {
			sendError(
				'Invalid token claims: The token contains invalid or mismatched claims.',
				401,
				res
			);
			return;
		}

		req.userId = decode.id_user;
		req.userData = user;
		next();
	} catch (err) {
		sendError('Invalid Token or expired token.', 401, res);
	}
};

export default authorizeMiddleware;
