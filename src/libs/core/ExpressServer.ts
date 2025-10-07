import express, { Application, Router } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import logger from './logger';
import { NODE_ENV } from '../config';

interface IExpressServerOptions {
	port: number | string;
	routerPath?: {
		basePath: string;
		exceptDir?: string[];
	};
}

export class ExpressServer {
	public app: Application;
	public httpServer: http.Server;
	private port: number | string;
	private routerPath?: IExpressServerOptions['routerPath'];

	constructor(options: IExpressServerOptions) {
		this.app = express();
		this.httpServer = http.createServer(this.app);
		this.port = options.port;
		this.routerPath = options.routerPath;

		this.setupMiddlewares();
	}

	private setupMiddlewares() {
		// Security middlewares
		this.app.use(helmet());
		this.app.use(cors());

		// Compression
		this.app.use(compression());

		// Body parser
		this.app.use(express.json({ limit: '10mb' }));
		this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

		// Logging
		if (NODE_ENV !== 'production') {
			this.app.use(morgan('dev'));
		} else {
			this.app.use(morgan('combined'));
		}

		// Static files
		this.app.use('/static', express.static(path.join(process.cwd(), 'storage/static/public')));
	}

	public pushGlobalMiddleware(middleware: any) {
		this.app.use(middleware);
	}

	private async loadRoutes() {
		if (!this.routerPath) {
			return;
		}

		const { basePath, exceptDir = [] } = this.routerPath;

		const loadRoutesFromDir = async (dir: string) => {
			const files = fs.readdirSync(dir);

			for (const file of files) {
				const fullPath = path.join(dir, file);
				const stat = fs.statSync(fullPath);

				// Skip if in except list
				if (exceptDir.some((exceptPath) => fullPath.includes(exceptPath))) {
					continue;
				}

				if (stat.isDirectory()) {
					await loadRoutesFromDir(fullPath);
				} else if (file.endsWith('.routes.ts') || file.endsWith('.routes.js')) {
					try {
						const route = await import(fullPath);
						const router: Router = route.default || route;

						if (router && typeof router === 'function') {
							this.app.use(router);
							logger.debug(`Loaded route: ${fullPath}`);
						}
					} catch (error) {
						logger.error(`Failed to load route: ${fullPath}`, error);
					}
				}
			}
		};

		await loadRoutesFromDir(basePath);
	}

	public async start() {
		// Load routes
		await this.loadRoutes();

		// 404 handler
		this.app.use((req, res) => {
			res.status(404).json({
				message: 'Route not found',
				result: null
			});
		});

		// Start server
		this.httpServer.listen(this.port, () => {
			logger.info(`Server running on port ${this.port}`);
			logger.info(`Environment: ${NODE_ENV}`);
		});
	}
}

