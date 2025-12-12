import { Router } from 'express';
import { requestHandler, requestValidator } from '@/libs/core';
import aiController from './ai.controller';
import authorizeMiddleware from '@/libs/middlewares/authorization.middleware';
import request from './ai.request';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: AI-powered features for content management
 */

/**
 * @swagger
 * /ai/status:
 *   get:
 *     summary: Get AI service status
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI service status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     service:
 *                       type: string
 *                     status:
 *                       type: string
 *                     features:
 *                       type: array
 *                       items:
 *                         type: string
 *                     models:
 *                       type: object
 *                     timestamp:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/ai/status', authorizeMiddleware, requestHandler(aiController.getStatus));

/**
 * @swagger
 * /ai/test-generate-content:
 *   post:
 *     summary: Test content generation without authentication (for debugging)
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               topic:
 *                 type: string
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: string
 *               contentType:
 *                 type: string
 *                 enum: [blog, article, tutorial, news, review]
 *               tone:
 *                 type: string
 *                 enum: [professional, casual, friendly, technical, creative]
 *               length:
 *                 type: string
 *                 enum: [short, medium, long]
 *               language:
 *                 type: string
 *                 enum: [id, en]
 *     responses:
 *       200:
 *         description: Content generated successfully
 *       500:
 *         description: Internal server error
 */
router.post('/ai/test-generate-content', requestValidator({ requestType: 'body', type: request.createContentGenerationValidation }), requestHandler(aiController.generateContent));

/**
 * @swagger
 * /ai/test-optimize-seo:
 *   post:
 *     summary: Test SEO optimization without authentication (for debugging)
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 description: Content title
 *               content:
 *                 type: string
 *                 description: Content body
 *               targetKeywords:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Target keywords for SEO
 *     responses:
 *       200:
 *         description: SEO optimization completed successfully
 *       500:
 *         description: Internal server error
 */
router.post('/ai/test-optimize-seo', requestValidator({ requestType: 'body', type: request.createSEOOptimizationValidation }), requestHandler(aiController.optimizeSEO));

/**
 * @swagger
 * /ai/generate-content:
 *   post:
 *     summary: Generate content using AI
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Content title (optional)
 *               topic:
 *                 type: string
 *                 description: Content topic (optional)
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Keywords for content
 *               contentType:
 *                 type: string
 *                 enum: [blog, article, tutorial, news, review]
 *                 default: blog
 *               tone:
 *                 type: string
 *                 enum: [professional, casual, friendly, technical, creative]
 *                 default: professional
 *               length:
 *                 type: string
 *                 enum: [short, medium, long]
 *                 default: medium
 *               language:
 *                 type: string
 *                 enum: [id, en]
 *                 default: id
 *     responses:
 *       200:
 *         description: Content generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     content:
 *                       type: string
 *                     excerpt:
 *                       type: string
 *                     metaDescription:
 *                       type: string
 *                     suggestedTags:
 *                       type: array
 *                       items:
 *                         type: string
 *                     suggestedCategory:
 *                       type: string
 *                     seoScore:
 *                       type: number
 *                     estimatedReadTime:
 *                       type: number
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/ai/generate-content', authorizeMiddleware, requestValidator({ requestType: 'body', type: request.createContentGenerationValidation }), requestHandler(aiController.generateContent));

/**
 * @swagger
 * /ai/optimize-seo:
 *   post:
 *     summary: Optimize content for SEO
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 description: Content title
 *               content:
 *                 type: string
 *                 description: Content body
 *               targetKeywords:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Target keywords for SEO
 *     responses:
 *       200:
 *         description: SEO optimization completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     optimizedTitle:
 *                       type: string
 *                     metaDescription:
 *                       type: string
 *                     suggestedKeywords:
 *                       type: array
 *                       items:
 *                         type: string
 *                     seoScore:
 *                       type: number
 *                     improvements:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/ai/optimize-seo', authorizeMiddleware, requestValidator({ requestType: 'body', type: request.createSEOOptimizationValidation }), requestHandler(aiController.optimizeSEO));

/**
 * @swagger
 * /ai/generate-image:
 *   post:
 *     summary: Generate image using AI
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: Image generation prompt
 *               style:
 *                 type: string
 *                 enum: [photographic, artistic, minimalist, vintage, cartoon, sketch]
 *                 default: photographic
 *               size:
 *                 type: string
 *                 enum: [small, medium, large]
 *                 default: medium
 *               aspectRatio:
 *                 type: string
 *                 enum: [1:1, 16:9, 4:3, 3:2]
 *                 default: 16:9
 *     responses:
 *       200:
 *         description: Image generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     imageUrl:
 *                       type: string
 *                     prompt:
 *                       type: string
 *                     style:
 *                       type: string
 *                     dimensions:
 *                       type: object
 *                       properties:
 *                         width:
 *                           type: number
 *                         height:
 *                           type: number
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/ai/generate-image', authorizeMiddleware, requestValidator({ requestType: 'body', type: request.createImageGenerationValidation }), requestHandler(aiController.generateImage));

/**
 * @swagger
 * /ai/auto-tagging:
 *   post:
 *     summary: Auto-tagging for content
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 description: Content title
 *               content:
 *                 type: string
 *                 description: Content body
 *               existingTags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Existing tags
 *     responses:
 *       200:
 *         description: Auto-tagging completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     suggestedTags:
 *                       type: array
 *                       items:
 *                         type: string
 *                     confidence:
 *                       type: number
 *                     reasoning:
 *                       type: string
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/ai/auto-tagging', authorizeMiddleware, requestValidator({ requestType: 'body', type: request.createAutoTaggingValidation }), requestHandler(aiController.autoTagging));

/**
 * @swagger
 * /ai/content-suggestions:
 *   get:
 *     summary: Get content suggestions (multiple titles and ideas)
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: topic
 *         required: true
 *         schema:
 *           type: string
 *         description: Content topic
 *       - in: query
 *         name: contentType
 *         schema:
 *           type: string
 *           enum: [blog, article, tutorial, news, review]
 *         description: Content type
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           enum: [id, en]
 *         description: Content language
 *       - in: query
 *         name: count
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           default: 5
 *         description: Number of suggestions to generate
 *     responses:
 *       200:
 *         description: Content suggestions generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Content suggestions generated successfully"
 *                 result:
 *                   type: object
 *                   properties:
 *                     suggestions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                             example: "Ultimate Guide to React Hooks"
 *                           excerpt:
 *                             type: string
 *                             example: "Learn how to use React Hooks effectively in your applications"
 *                           estimatedReadTime:
 *                             type: number
 *                             example: 8
 *                           seoScore:
 *                             type: number
 *                             example: 85
 *                           suggestedTags:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ["react", "hooks", "javascript"]
 *                           suggestedCategory:
 *                             type: string
 *                             example: "Programming"
 *                     totalSuggestions:
 *                       type: number
 *                       example: 5
 *                     topic:
 *                       type: string
 *                       example: "React Hooks"
 *                     contentType:
 *                       type: string
 *                       example: "blog"
 *                     language:
 *                       type: string
 *                       example: "en"
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/ai/content-suggestions', authorizeMiddleware, requestValidator({ requestType: 'query', type: request.createContentSuggestionsQueryValidation }), requestHandler(aiController.getContentSuggestions));

/**
 * @swagger
 * /ai/test-zenmux:
 *   post:
 *     summary: Test Zenmux API response format
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: Test prompt to send to Zenmux API
 *                 example: "Buat artikel tentang teknologi AI"
 *               model:
 *                 type: string
 *                 description: Optional model name in format "provider/model-name". If not provided, defaults to "openai/gpt-4o-mini". Note: Some models require credits (error 402).
 *                 example: "openai/gpt-4o-mini"
 *     responses:
 *       200:
 *         description: Zenmux API test response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 result:
 *                   type: object
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post('/ai/test-zenmux', authorizeMiddleware, requestHandler(aiController.testZenmux));

export default router;
