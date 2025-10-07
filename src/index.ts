import './libs/helpers/initModuleAlias';
import { dump, logger } from '@/libs/core';
import httpServer from '@http/index';
import postgresConnection from './libs/config/postgresConnection';

(
	async () => {
		try {
			// Start infrastructure
			await postgresConnection.init();

			// Start application
			await httpServer();

			// Handle graceful shutdown
			process.on('SIGTERM', async () => {
				logger.info('SIGTERM signal received: closing HTTP server');
				await postgresConnection.close();
				process.exit(0);
			});

			process.on('SIGINT', async () => {
				logger.info('SIGINT signal received: closing HTTP server');
				await postgresConnection.close();
				process.exit(0);
			});
		} catch (error) {
			dump(error);
			process.exit(1);
		}
	}
)();
