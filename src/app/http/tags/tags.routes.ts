import { Router } from 'express';
import { requestHandler, requestValidator } from '@/libs/core';
import authorizationMiddleware from '@/libs/middlewares/authorization.middleware';
import controller from './tags.controller';
import request from './tags.request';

const router = Router();

/**
 * GET /tags
 * @tags Tags
 * @summary List all tags
 * @description Get paginated list of tags with optional post counts and search
 *
 * @param {number} page.query - Page number (default: 1)
 * @param {number} limit.query - Items per page (default: 50, max: 100)
 * @param {string} search.query - Search in tag names
 * @param {string} sortBy.query.enum:name,created_at,post_count - Sort by field (default: name)
 * @param {string} includeCount.query - Include post count per tag (true/false)
 *
 * @return {object} 200 - Success response with tags array
 * @return {object} 400 - Bad request
 *
 * @example response - 200 - Success response
 * {
 *   "message": "Tags retrieved successfully",
 *   "result": [
 *     {
 *       "id": "uuid",
 *       "name": "JavaScript",
 *       "slug": "javascript",
 *       "post_count": 45,
 *       "created_at": "2025-10-22T10:30:00Z"
 *     },
 *     {
 *       "id": "uuid",
 *       "name": "TypeScript",
 *       "slug": "typescript",
 *       "post_count": 32,
 *       "created_at": "2025-10-22T10:30:00Z"
 *     }
 *   ],
 *   "meta": {
 *     "page": 1,
 *     "limit": 50,
 *     "total": 78,
 *     "totalPages": 2,
 *     "hasNextPage": true,
 *     "hasPrevPage": false
 *   }
 * }
 */
router.get(
	'/tags',
	requestValidator({
		requestType: 'query',
		type: request.listTagsQueryValidation
	}),
	requestHandler(controller.listTags)
);

/**
 * GET /tags/suggestions
 * @tags Tags
 * @summary Get tag suggestions for autocomplete
 * @description Search tags by name for autocomplete functionality. Results are sorted by relevance and popularity.
 *
 * @param {string} q.query.required - Search query
 * @param {number} limit.query - Max suggestions to return (default: 5, max: 20)
 *
 * @return {object} 200 - Success response with tag suggestions
 * @return {object} 400 - Bad request
 *
 * @example response - 200 - Success response
 * {
 *   "message": "Tag suggestions retrieved successfully",
 *   "result": [
 *     {
 *       "id": "uuid",
 *       "name": "JavaScript",
 *       "slug": "javascript",
 *       "post_count": 45
 *     },
 *     {
 *       "id": "uuid",
 *       "name": "Java",
 *       "slug": "java",
 *       "post_count": 23
 *     }
 *   ]
 * }
 */
router.get(
	'/tags/suggestions',
	requestValidator({
		requestType: 'query',
		type: request.tagSuggestionsQueryValidation
	}),
	requestHandler(controller.getTagSuggestions)
);

/**
 * GET /tags/:id
 * @tags Tags
 * @summary Get single tag by ID
 * @description Retrieve detailed information about a specific tag including post count and optionally recent posts
 *
 * @param {string} id.path.required - Tag ID (UUID)
 * @param {string} includePosts.query - Include recent posts (true/false, default: false)
 * @param {number} postsLimit.query - Number of posts to include (default: 5, max: 20)
 *
 * @return {object} 200 - Success response with tag details
 * @return {object} 404 - Tag not found
 *
 * @example response - 200 - Success response
 * {
 *   "message": "Tag retrieved successfully",
 *   "result": {
 *     "id": "uuid",
 *     "name": "JavaScript",
 *     "slug": "javascript",
 *     "post_count": 45,
 *     "recentPosts": [
 *       {
 *         "id": "uuid",
 *         "title": "Getting Started with JavaScript",
 *         "slug": "getting-started-with-javascript",
 *         "excerpt": "Learn JavaScript basics...",
 *         "created_at": "2025-10-22T10:30:00Z"
 *       }
 *     ],
 *     "created_at": "2025-10-22T10:30:00Z"
 *   }
 * }
 */
router.get(
	'/tags/:id',
	requestHandler(controller.getTag)
);

/**
 * POST /tags
 * @tags Tags
 * @security BearerAuth
 * @summary Create a new tag
 * @description Create a new tag. Administrators and editors can create tags.
 *
 * @typedef {object} CreateTag
 * @property {string} name.required - Tag name (2-50 characters)
 *
 * @param {CreateTag} request.body.required - Tag data
 *
 * @return {object} 200 - Tag created successfully
 * @return {object} 400 - Validation error or tag already exists
 * @return {object} 401 - Unauthorized
 * @return {object} 403 - Forbidden (admin/editor only)
 *
 * @example request - Create tag
 * {
 *   "name": "Machine Learning"
 * }
 *
 * @example response - 200 - Success response
 * {
 *   "message": "Tag created successfully",
 *   "result": {
 *     "id": "uuid",
 *     "name": "Machine Learning",
 *     "slug": "machine-learning",
 *     "created_at": "2025-10-22T10:30:00Z"
 *   }
 * }
 */
router.post(
	'/tags',
	authorizationMiddleware,
	requestValidator({
		requestType: 'body',
		type: request.createTagValidation
	}),
	requestHandler(controller.createTag)
);

/**
 * PUT /tags/:id
 * @tags Tags
 * @security BearerAuth
 * @summary Update a tag
 * @description Update an existing tag. Administrators and editors can update tags.
 *
 * @param {string} id.path.required - Tag ID (UUID)
 *
 * @typedef {object} UpdateTag
 * @property {string} name.required - Tag name (2-50 characters)
 *
 * @param {UpdateTag} request.body.required - Tag data to update
 *
 * @return {object} 200 - Tag updated successfully
 * @return {object} 400 - Validation error or tag name already exists
 * @return {object} 401 - Unauthorized
 * @return {object} 403 - Forbidden (admin/editor only)
 * @return {object} 404 - Tag not found
 *
 * @example request - Update tag
 * {
 *   "name": "Deep Learning"
 * }
 *
 * @example response - 200 - Success response
 * {
 *   "message": "Tag updated successfully",
 *   "result": {
 *     "id": "uuid",
 *     "name": "Deep Learning",
 *     "slug": "deep-learning",
 *     "created_at": "2025-10-22T10:30:00Z"
 *   }
 * }
 */
router.put(
	'/tags/:id',
	authorizationMiddleware,
	requestValidator({
		requestType: 'body',
		type: request.updateTagValidation
	}),
	requestHandler(controller.updateTag)
);

/**
 * DELETE /tags/:id
 * @tags Tags
 * @security BearerAuth
 * @summary Delete a tag
 * @description Delete a tag. Only administrators can delete tags. Post-tag relationships will be removed automatically.
 *
 * @param {string} id.path.required - Tag ID (UUID)
 *
 * @return {object} 200 - Tag deleted successfully
 * @return {object} 401 - Unauthorized
 * @return {object} 403 - Forbidden (admin only)
 * @return {object} 404 - Tag not found
 *
 * @example response - 200 - Success response
 * {
 *   "message": "Tag deleted successfully",
 *   "result": null
 * }
 */
router.delete(
	'/tags/:id',
	authorizationMiddleware,
	requestHandler(controller.deleteTag)
);

export default router;

