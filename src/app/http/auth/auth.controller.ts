import postgresConnection from '@/libs/config/postgresConnection';
import { TRequestFunction, InvalidParameterException } from '@/libs/core';
import { TLoginValidation } from './auth.request';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { APP_SECRET_KEY } from '@/libs/config';

const login: TRequestFunction = async (req) => {
	const { username, password } = req.body as TLoginValidation;
	
	const user = await postgresConnection.queryOne<Entity.IUser>(
		'SELECT * FROM users WHERE username = $1 LIMIT 1',
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
		{ id_user: user.id_user, nama: user.nama, username: user.username },
		APP_SECRET_KEY,
		{ expiresIn: '7d' }
	);

	return {
		result: {
			user: {
				id_user: user.id_user,
				nama: user.nama,
				username: user.username,
				level: user.level
			},
			token
		}
	};
};

const logout: TRequestFunction = async (req) => {
	await postgresConnection.query(
		'UPDATE users SET status_login = $1, ip_address = $2 WHERE id_user = $3',
		['FREE', '', req.userId]
	);

	return {
		message: 'Logout berhasil'
	};
};

export default {
	login,
	logout
};
