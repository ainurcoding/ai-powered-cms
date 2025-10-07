import { PoolClient } from 'pg';
import postgresConnection from '@/libs/config/postgresConnection';

class BaseRepository {
	protected db = postgresConnection;

	async query<T = any>(text: string, params?: any[]): Promise<T[]> {
		return await this.db.query<T>(text, params);
	}

	async queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
		return await this.db.queryOne<T>(text, params);
	}

	async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
		return await this.db.transaction<T>(callback);
	}

	/**
	 * Method ini berfungsi untuk memparsing arguments string menjadi query column_name
	 */
	protected parsingSelectArgs(selectArgs: string[]): string {
		let selectedFields = '*';

		if (selectArgs && selectArgs.length > 0) {
			selectedFields = selectArgs.join(', ');
		}

		return selectedFields;
	}

	/**
	 * Helper untuk generate placeholder PostgreSQL ($1, $2, dst)
	 */
	protected generatePlaceholders(count: number, startIndex: number = 1): string {
		return Array.from({ length: count }, (_, i) => `$${i + startIndex}`).join(', ');
	}
}

export default BaseRepository;
