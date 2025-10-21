import postgresConnection from '@/libs/config/postgresConnection';
import { TRequestFunction, InvalidParameterException } from '@/libs/core';
import { TLoginValidation } from './auth.request';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { APP_SECRET_KEY } from '@/libs/config';
import tokenBlacklist from '@/libs/core/tokenBlacklist';

const login: TRequestFunction = async (req) => {
	const { username, password } = req.body as TLoginValidation;
	
	const user = await postgresConnection.queryOne<Entity.IUser>(
		'SELECT * FROM users WHERE username = $1 AND is_active = true LIMIT 1',
		[username]
	);

	if (!user) {
		throw new InvalidParameterException('Username atau password salah');
	}

	// Verify password using bcrypt
	const isPasswordValid = await bcrypt.compare(password, user.password || '');
	
	if (!isPasswordValid) {
		throw new InvalidParameterException('Username atau password salah');
	}

	const token = jwt.sign(
		{ id: user.id, name: user.name, username: user.username, role: user.role },
		APP_SECRET_KEY,
		{ expiresIn: '7d' }
	);

	return {
		result: {
			user: {
				id: user.id,
				name: user.name,
				username: user.username,
				email: user.email,
				role: user.role
			},
			token
		}
	};
};

const logout: TRequestFunction = async (req) => {
	const token = req.headers.authorization?.replace('Bearer ', '');
	
	if (token) {
		// Add token to blacklist
		tokenBlacklist.add(token);
	}

	return {
		message: 'Logout berhasil'
	};
};

const checkToken: TRequestFunction = async (req) => {
	const token = req.headers.authorization?.replace('Bearer ', '');
	
	if (!token) {
		throw new InvalidParameterException('Token tidak ditemukan');
	}

	const isBlacklisted = tokenBlacklist.isBlacklisted(token);
	
	return {
		result: {
			isValid: !isBlacklisted,
			isBlacklisted,
			message: isBlacklisted ? 'Token telah di-revoke' : 'Token masih valid'
		}
	};
};

export default {
	login,
	logout,
	checkToken
};
