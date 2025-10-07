import { Router } from 'express';
import { requestHandler } from '@/libs/core';
import controller from './home.controller';

const defaultRouter = Router();

/**
 * GET /
 * @tags Common
 * @summary informasi aplikasi dan healthcheck
 * @return {object} 200 - success
 * @example response - 200 - success
 * {
 * 	"message": "Success",
 * 	"result": {
 * 		"APP_NAME": "rest-boilerplate-ts",
 * 		"APP_VERSION": "1.0.0"
 * 	}
 * }
 */
defaultRouter.get('/', requestHandler(controller.home));

export default defaultRouter;
