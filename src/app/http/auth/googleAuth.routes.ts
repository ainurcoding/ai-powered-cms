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
 *     summary: Handle Google OAuth callback (redirect to frontend or exchange token)
 *     description: |
 *       IMPORTANT - This endpoint handles 2 scenarios:
 *       1. Browser redirect from Google: Redirects to frontend with code (302 redirect)
 *       2. API call from frontend: Exchanges code with token and returns JSON (200 response)
 *       
 *       Flow:
 *       1. Google redirects to: http://localhost:8000/auth/google/callback?code=xxx
 *       2. Backend redirects to: http://localhost:5173/auth/google/callback?code=xxx
 *       3. Frontend calls: GET /auth/google/callback?code=xxx (with Accept: application/json header)
 *       4. Backend returns: { user, token, isNewUser }
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
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: State parameter from Google (optional)
 *       - in: header
 *         name: Accept
 *         schema:
 *           type: string
 *         description: Set to "application/json" for API call, omit for browser redirect
 *     responses:
 *       302:
 *         description: Redirect to frontend with code (browser redirect from Google)
 *         headers:
 *           Location:
 *             description: Frontend callback URL with code
 *             schema:
 *               type: string
 *             example: http://localhost:5173/auth/google/callback?code=xxx
 *       200:
 *         description: Token exchange successful (API call from frontend)
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
 *         description: OAuth callback failed or invalid code
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
