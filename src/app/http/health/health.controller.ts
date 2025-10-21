import { TRequestFunction } from '@/libs/core';
import { APP_NAME, APP_VERSION, NODE_ENV } from '@/libs/config';
import postgresConnection from '@/libs/config/postgresConnection';

/**
 * Basic health check - API status
 */
const basic: TRequestFunction = async () => {
	return {
		result: {
			status: 'healthy',
			service: APP_NAME,
			version: APP_VERSION,
			environment: NODE_ENV,
			timestamp: new Date().toISOString(),
			uptime: process.uptime()
		}
	};
};

/**
 * Detailed health check - dengan database check
 */
const detailed: TRequestFunction = async () => {
	const checks: any = {
		api: 'healthy',
		database: 'unknown',
		memory: 'unknown'
	};

	// Check database connection
	try {
		await postgresConnection.query('SELECT 1');
		checks.database = 'healthy';
	} catch (error) {
		checks.database = 'unhealthy';
	}

	// Check memory usage
	const memoryUsage = process.memoryUsage();
	checks.memory = {
		rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
		heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
		heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
		external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`
	};

	// Overall status
	const overallStatus = checks.database === 'healthy' ? 'healthy' : 'degraded';

	return {
		result: {
			status: overallStatus,
			service: APP_NAME,
			version: APP_VERSION,
			environment: NODE_ENV,
			timestamp: new Date().toISOString(),
			uptime: `${Math.round(process.uptime())} seconds`,
			checks
		}
	};
};

/**
 * Database info
 */
const database: TRequestFunction = async () => {
	try {
		// Get database version
		const [versionResult] = await postgresConnection.query('SELECT version()');
		
		// Get database size
		const [sizeResult] = await postgresConnection.query(`
			SELECT pg_database_size(current_database()) as size
		`);

		// Get table count
		const [tableCount] = await postgresConnection.query(`
			SELECT COUNT(*) as count 
			FROM information_schema.tables 
			WHERE table_schema = 'public'
		`);

		return {
			result: {
				status: 'connected',
				version: versionResult.version,
				database: 'ai_cms_db',
				size: `${Math.round(Number(sizeResult.size) / 1024 / 1024)} MB`,
				tables: Number(tableCount.count),
				timestamp: new Date().toISOString()
			}
		};
	} catch (error) {
		return {
			result: {
				status: 'error',
				message: error instanceof Error ? error.message : 'Database connection failed',
				timestamp: new Date().toISOString()
			}
		};
	}
};

export default {
	basic,
	detailed,
	database
};

