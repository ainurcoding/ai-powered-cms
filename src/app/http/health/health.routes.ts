import { Router } from 'express';
import { requestHandler } from '@/libs/core';
import controller from './health.controller';

const router = Router();

/**
 * GET /health
 * @tags Health Check
 * @summary Basic health check
 * @description Check API status - simple health check
 * @return {object} 200 - success
 * @example response - 200 - success
 * {
 *   "message": "Success",
 *   "result": {
 *     "status": "healthy",
 *     "service": "rest-boilerplate-ts",
 *     "version": "1.0.0",
 *     "environment": "development",
 *     "timestamp": "2025-10-07T10:00:00.000Z",
 *     "uptime": 123.45
 *   }
 * }
 */
router.get('/health', requestHandler(controller.basic));

/**
 * GET /health/detailed
 * @tags Health Check
 * @summary Detailed health check
 * @description Check API, database, and system status
 * @return {object} 200 - success
 * @example response - 200 - success
 * {
 *   "message": "Success",
 *   "result": {
 *     "status": "healthy",
 *     "service": "rest-boilerplate-ts",
 *     "version": "1.0.0",
 *     "environment": "development",
 *     "timestamp": "2025-10-07T10:00:00.000Z",
 *     "uptime": "123 seconds",
 *     "checks": {
 *       "api": "healthy",
 *       "database": "healthy",
 *       "memory": {
 *         "rss": "50 MB",
 *         "heapTotal": "20 MB",
 *         "heapUsed": "15 MB",
 *         "external": "2 MB"
 *       }
 *     }
 *   }
 * }
 */
router.get('/health/detailed', requestHandler(controller.detailed));

/**
 * GET /health/database
 * @tags Health Check
 * @summary Database health check
 * @description Check database connection, version, size, and table count
 * @return {object} 200 - success
 * @example response - 200 - success
 * {
 *   "message": "Success",
 *   "result": {
 *     "status": "connected",
 *     "version": "PostgreSQL 16.0",
 *     "database": "ai_cms_db",
 *     "size": "8 MB",
 *     "tables": 1,
 *     "timestamp": "2025-10-07T10:00:00.000Z"
 *   }
 * }
 */
router.get('/health/database', requestHandler(controller.database));

export default router;

