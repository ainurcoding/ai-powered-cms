import { Router } from 'express';
import googleAuthController from './googleAuth.controller';
import { requestHandler } from '@libs/core';

const router = Router();

/**
 * @swagger
 * /auth/google/url:
 *   get:
 *     summary: Get Google OAuth authorization URL
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Google OAuth URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: object
 *                   properties:
 *                     authUrl:
 *                       type: string
 *                       description: Google OAuth authorization URL
 *                     message:
 *                       type: string
 *       400:
 *         description: Invalid configuration
 */
router.get('/url', requestHandler(googleAuthController.getGoogleAuthUrl));

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Handle Google OAuth callback
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Authorization code from Google
 *       - in: query
 *         name: error
 *         schema:
 *           type: string
 *         description: Error code if OAuth failed
 *       - in: query
 *         name: error_description
 *         schema:
 *           type: string
 *         description: Error description if OAuth failed
 *     responses:
 *       200:
 *         description: OAuth callback processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         username:
 *                           type: string
 *                         email:
 *                           type: string
 *                         name:
 *                           type: string
 *                         role:
 *                           type: string
 *                         avatar:
 *                           type: string
 *                         isActive:
 *                           type: boolean
 *                     token:
 *                       type: string
 *                       description: JWT token for authentication
 *                     isNewUser:
 *                       type: boolean
 *                       description: Whether this is a new user registration
 *                     message:
 *                       type: string
 *       400:
 *         description: OAuth callback failed
 */
router.get('/callback', requestHandler(googleAuthController.handleGoogleCallback));

/**
 * @swagger
 * /auth/google/test-config:
 *   get:
 *     summary: Test Google OAuth configuration
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Configuration test successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: object
 *                   properties:
 *                     clientId:
 *                       type: string
 *                     clientSecret:
 *                       type: string
 *                     callbackUrl:
 *                       type: string
 *                     scopes:
 *                       type: array
 *                       items:
 *                         type: string
 *                     message:
 *                       type: string
 *       400:
 *         description: Configuration test failed
 */
router.get('/test-config', requestHandler(googleAuthController.testGoogleConfig));

export default router;
