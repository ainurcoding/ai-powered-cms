import { Pool, PoolClient, QueryResult } from 'pg';
import { postgresConfig, NODE_ENV } from '.';
import logger from '../core/logger';

class PostgresConnector {
	private pool: Pool;
	private isInitialized: boolean = false;

	constructor() {
		this.pool = new Pool({
			host: postgresConfig.HOST,
			port: Number(postgresConfig.PORT),
			database: postgresConfig.NAME,
			user: postgresConfig.USER,
			password: postgresConfig.PASSWORD,
			max: 20, // Maximum number of clients in the pool
			idleTimeoutMillis: 30000,
			connectionTimeoutMillis: 2000
		});

		this.setupEventHandlers();
	}

	private setupEventHandlers() {
		this.pool.on('connect', () => {
			if (NODE_ENV !== 'production') {
				logger.debug('New PostgreSQL client connected');
			}
		});

		this.pool.on('error', (err) => {
			logger.error('Unexpected error on idle PostgreSQL client', err);
		});
	}

	async init(): Promise<void> {
		try {
			const client = await this.pool.connect();
			logger.info('PostgreSQL connection established successfully');
			client.release();
			this.isInitialized = true;
		} catch (error) {
			logger.error('Failed to connect to PostgreSQL', error);
			throw error;
		}
	}

	async query<T = any>(text: string, params?: any[]): Promise<T[]> {
		const start = Date.now();
		try {
			const result: QueryResult = await this.pool.query(text, params);
			const duration = Date.now() - start;

			if (NODE_ENV !== 'production') {
				logger.debug('Executed query', { text, duration, rows: result.rowCount });
			}

			return result.rows as T[];
		} catch (error) {
			logger.error('Query error', { text, error });
			throw error;
		}
	}

	async queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
		const result = await this.query<T>(text, params);
		return result.length > 0 ? result[0] : null;
	}

	async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
		const client = await this.pool.connect();
		try {
			await client.query('BEGIN');
			const result = await callback(client);
			await client.query('COMMIT');
			return result;
		} catch (error) {
			await client.query('ROLLBACK');
			throw error;
		} finally {
			client.release();
		}
	}

	getPool(): Pool {
		return this.pool;
	}

	async close(): Promise<void> {
		await this.pool.end();
		logger.info('PostgreSQL pool has ended');
	}
}

const postgresConnection = new PostgresConnector();

export default postgresConnection;

