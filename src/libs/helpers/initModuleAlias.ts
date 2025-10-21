/**
 * File ini berfungsi untuk melakukan inisialisasi module alias pada hasil build
 */

import moduleAlias from 'module-alias';
import path from 'path';

(async () => {
	try {
		if (path.basename(require.main?.path ?? '') !== 'data:text') {
			moduleAlias.addAliases({
				'@': path.join(process.cwd(), 'dist'),
				'@http': path.join(process.cwd(), 'dist/app/http/'),
				'@httpController': path.join(
					process.cwd(),
					'dist/app/http/controller/'
				),
				'@httpMiddlewares': path.join(process.cwd(), 'dist/app/http/middleware/'),
				'@repositories': path.join(process.cwd(), 'dist/repositories/'),
				'@libs': path.join(process.cwd(), 'dist/libs/'),
				'@services': path.join(process.cwd(), 'dist/services/')
			});

			moduleAlias();
		}
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error('Module alias initialization error:', error);
		process.exit(1);
	}
})();
