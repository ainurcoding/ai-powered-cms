export class AppException extends Error {
	statusCode: number;
	isOperational: boolean;

	constructor(message: string, statusCode: number = 500) {
		super(message);
		this.statusCode = statusCode;
		this.isOperational = true;
		Error.captureStackTrace(this, this.constructor);
	}
}

export class BadRequestException extends AppException {
	constructor(message: string = 'Bad Request') {
		super(message, 400);
	}
}

export class UnauthorizedException extends AppException {
	constructor(message: string = 'Unauthorized') {
		super(message, 401);
	}
}

export class ForbiddenException extends AppException {
	constructor(message: string = 'Forbidden') {
		super(message, 403);
	}
}

export class NotFoundException extends AppException {
	constructor(message: string = 'Not Found') {
		super(message, 404);
	}
}

export class ConflictException extends AppException {
	constructor(message: string = 'Conflict') {
		super(message, 409);
	}
}

export class InvalidParameterException extends AppException {
	constructor(message: string = 'Invalid Parameter') {
		super(message, 422);
	}
}

export class InternalServerException extends AppException {
	constructor(message: string = 'Internal Server Error') {
		super(message, 500);
	}
}

