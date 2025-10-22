import dotenv from 'dotenv';
import packageJson from '../../../package.json';

dotenv.config();

export const APP_NAME = packageJson.name || 'ai-cms-backend';
export const APP_VERSION = packageJson.version || '0.0.0';

export const NODE_ENV = process.env.NODE_ENV ?? 'development';
export const APP_SECRET_KEY = process.env.APP_SECRET_KEY || 'secret';
export const APP_PORT_HTTP = String(process.env.APP_PORT_HTTP) || '8000';
export const APP_EXPOSE_DOCS = Boolean(process.env.APP_EXPOSE_DOCS) || true;

export const postgresConfig = {
	HOST: process.env.DB_HOST_POSTGRES || 'localhost',
	NAME: process.env.DB_NAME_POSTGRES || 'postgres',
	USER: process.env.DB_USER_POSTGRES || 'postgres',
	PORT: process.env.DB_PORT_POSTGRES || 5432,
	PASSWORD: process.env.DB_PASS_POSTGRES || ''
};

// Export AI configuration
export * from './ai';
