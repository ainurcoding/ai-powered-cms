import { logger } from '@/libs/core';
import { ExpressServer } from '@/libs/core/ExpressServer';
import { APP_EXPOSE_DOCS, APP_NAME, APP_PORT_HTTP, APP_VERSION } from '@/libs/config';
import expressJSDocSwagger from 'express-jsdoc-swagger';
import express from 'express';
import path from 'path';
import authorizeMiddleware from '@/libs/middlewares/authorization.middleware';
import { initSocketIO } from '../ws';

async function httpServer() {
	try {
		const server = new ExpressServer({
			routerPath: {
				basePath: __dirname,
				exceptDir: [
					path.join(__dirname, 'middlewares')
				]
			},
			port: Number(APP_PORT_HTTP)
		});

		// jika tidak perlu bisa dimatika dan uninstall libs socket io
		// standar yang digunakan saat ini socket io v4
		initSocketIO(server.httpServer);

		expressJSDocSwagger(server.app)(swaggerOptions);

		// Static files untuk temporary AI images (bypass auth)
		server.app.use('/static/temp/ai-images', express.static(path.join(process.cwd(), 'storage/temp/ai-images')));

		// Cleanup old temporary AI images on startup
		const { aiService } = await import('@/libs/services/aiService');
		await aiService.cleanupOldTempFiles();

		// semua endpoint secara default perlu login,
		// jika ingin bypass pengecekan token tambahkan path ke file ./libs/config/guestPathHttp.ts
		server.pushGlobalMiddleware(authorizeMiddleware);

		await server.start();
	} catch (error) {
		logger.error('HTTP server error');
		throw error;
	}
}

// see documentation https://brikev.github.io/express-jsdoc-swagger-docs/#/
const swaggerOptions = {
	info: {
		version: `${APP_VERSION}`,
		title: `${APP_NAME}`,
		description: 'REST API DOCUMENTATION'
	},
	security: {
		BearerAuth: {
			type: 'http',
			scheme: 'bearer'
		}
	},
	baseDir: __dirname,
	filesPattern: './**/*.routes.{js,ts}',
	swaggerUIPath: '/docs',
	exposeSwaggerUI: APP_EXPOSE_DOCS,
	// Expose Open API JSON Docs documentation in `apiDocsPath` path.
	exposeApiDocs: APP_EXPOSE_DOCS,
	// Open API JSON Docs endpoint.
	apiDocsPath: '/json-api-docs',
	// Set non-required fields as nullable by default
	notRequiredAsNullable: false,
	// You can customize your UI options.
	// you can extend swagger-ui-express config. You can checkout an example of this
	// in the `example/configuration/swaggerOptions.js`
	swaggerUiOptions: {},
	multiple: false
};

export default httpServer;
