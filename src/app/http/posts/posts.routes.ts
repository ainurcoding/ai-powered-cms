import { Router } from 'express';
import { requestHandler, requestValidator } from '@/libs/core';
import authorizationMiddleware from '@/libs/middlewares/authorization.middleware';
import controller from './posts.controller';
import request from './posts.request';

const router = Router();

/**
 * GET /posts
 * @tags Posts
 * @summary List all posts with pagination and filters
 * @description Get a paginated list of posts with optional filtering by status, category, tag, author, and search term
 *
 * @param {number} page.query - Page number (default: 1)
 * @param {number} limit.query - Items per page (default: 10, max: 100)
 * @param {string} status.query.enum:draft,published,archived - Filter by post status
 * @param {string} category.query - Filter by category ID (UUID)
 * @param {string} tag.query - Filter by tag ID (UUID)
 * @param {string} author.query - Filter by author ID (UUID)
 * @param {string} search.query - Search in title, content, and excerpt
 * @param {string} sortBy.query.enum:created_at,updated_at,title,published_at - Sort field (default: created_at)
 * @param {string} sortOrder.query.enum:asc,desc - Sort order (default: desc)
 *
 * @return {object} 200 - Success response with posts array and pagination meta
 * @return {object} 400 - Bad request
 *
 * @example response - 200 - Success response
 * {
 *   "message": "Posts retrieved successfully",
 *   "result": [
 *     {
 *       "id": "uuid",
 *       "title": "Getting Started with TypeScript",
 *       "slug": "getting-started-with-typescript",
 *       "excerpt": "Learn the basics of TypeScript...",
 *       "content": "<h1>Getting Started...</h1>",
 *       "status": "published",
 *       "featuredImage": "https://...",
 *       "author": {
 *         "id": "uuid",
 *         "name": "John Doe",
 *         "email": "john@example.com",
 *         "avatar": "https://..."
 *       },
 *       "category": {
 *         "id": "uuid",
 *         "name": "Technology",
 *         "slug": "technology"
 *       },
 *       "tags": [
 *         {
 *           "id": "uuid",
 *           "name": "TypeScript",
 *           "slug": "typescript"
 *         }
 *       ],
 *       "viewCount": 123,
 *       "createdAt": "2025-10-22T10:30:00Z",
 *       "updatedAt": "2025-10-22T10:30:00Z"
 *     }
 *   ],
 *   "meta": {
 *     "page": 1,
 *     "limit": 10,
 *     "total": 45,
 *     "totalPages": 5,
 *     "hasNextPage": true,
 *     "hasPrevPage": false
 *   }
 * }
 */
router.get(
	'/posts',
	requestValidator({
		requestType: 'query',
		type: request.listPostsQueryValidation
	}),
	requestHandler(controller.listPosts)
);

/**
 * GET /posts/:id
 * @tags Posts
 * @summary Get single post by ID
 * @description Retrieve detailed information about a specific post including author, category, and tags
 *
 * @param {string} id.path.required - Post ID (UUID)
 *
 * @return {object} 200 - Success response with post details
 * @return {object} 404 - Post not found
 *
 * @example response - 200 - Success response
 * {
 *   "message": "Post retrieved successfully",
 *   "result": {
 *     "id": "uuid",
 *     "title": "Getting Started with TypeScript",
 *     "slug": "getting-started-with-typescript",
 *     "excerpt": "Learn the basics...",
 *     "content": "<h1>Full HTML content...</h1>",
 *     "status": "published",
 *     "featuredImage": "https://...",
 *     "metaTitle": "Getting Started with TypeScript - Complete Guide",
 *     "metaDescription": "Learn TypeScript from scratch...",
 *     "metaKeywords": "typescript, javascript, tutorial",
 *     "author": {
 *       "id": "uuid",
 *       "name": "John Doe",
 *       "email": "john@example.com",
 *       "avatar": "https://..."
 *     },
 *     "category": {
 *       "id": "uuid",
 *       "name": "Technology",
 *       "slug": "technology",
 *       "description": "Tech related posts"
 *     },
 *     "tags": [
 *       {
 *         "id": "uuid",
 *         "name": "TypeScript",
 *         "slug": "typescript"
 *       }
 *     ],
 *     "viewCount": 123,
 *     "publishedAt": "2025-10-22T10:30:00Z",
 *     "createdAt": "2025-10-22T10:30:00Z",
 *     "updatedAt": "2025-10-22T10:30:00Z"
 *   }
 * }
 */
router.get(
	'/posts/:id',
	requestHandler(controller.getPost)
);

/**
 * POST /posts
 * @tags Posts
 * @security BearerAuth
 * @summary Create a new post
 * @description Create a new post with title, content, and optional fields. Requires authentication.
 *
 * @typedef {object} CreatePost
 * @property {string} title.required - Post title (3-255 characters)
 * @property {string} content.required - Post content (HTML, min 10 characters)
 * @property {string} excerpt - Short description (max 500 characters, auto-generated if not provided)
 * @property {string} status.enum:draft,published,archived - Post status (default: draft)
 * @property {string} featuredImage - Featured image URL
 * @property {string} categoryId - Category ID (UUID)
 * @property {array<string>} tagIds - Array of tag IDs (UUIDs)
 * @property {string} metaTitle - SEO meta title (max 255 characters)
 * @property {string} metaDescription - SEO meta description (max 500 characters)
 * @property {string} metaKeywords - SEO keywords (comma-separated)
 *
 * @param {CreatePost} request.body.required - Post data
 *
 * @return {object} 200 - Post created successfully
 * @return {object} 400 - Validation error
 * @return {object} 401 - Unauthorized
 *
 * @example request - Create post payload
 * {
 *   "title": "My New Blog Post",
 *   "content": "<p>This is the content...</p>",
 *   "excerpt": "Short description",
 *   "status": "draft",
 *   "featuredImage": "https://cloudinary.com/image.jpg",
 *   "categoryId": "uuid",
 *   "tagIds": ["uuid1", "uuid2"],
 *   "metaTitle": "My New Blog Post - Complete Guide",
 *   "metaDescription": "Learn about...",
 *   "metaKeywords": "blog, tutorial, guide"
 * }
 *
 * @example response - 200 - Success response
 * {
 *   "message": "Post created successfully",
 *   "result": {
 *     "id": "uuid",
 *     "title": "My New Blog Post",
 *     "slug": "my-new-blog-post",
 *     "status": "draft",
 *     "author": { ... },
 *     "category": { ... },
 *     "tags": [ ... ]
 *   }
 * }
 */
router.post(
	'/posts',
	authorizationMiddleware,
	requestValidator({
		requestType: 'body',
		type: request.createPostValidation
	}),
	requestHandler(controller.createPost)
);

/**
 * PUT /posts/:id
 * @tags Posts
 * @security BearerAuth
 * @summary Update a post
 * @description Update an existing post. All fields are optional. Requires authentication.
 *
 * @param {string} id.path.required - Post ID (UUID)
 *
 * @typedef {object} UpdatePost
 * @property {string} title - Post title (3-255 characters)
 * @property {string} content - Post content (HTML, min 10 characters)
 * @property {string} excerpt - Short description (max 500 characters)
 * @property {string} status.enum:draft,published,archived - Post status
 * @property {string} featuredImage - Featured image URL
 * @property {string} categoryId - Category ID (UUID)
 * @property {array<string>} tagIds - Array of tag IDs (UUIDs)
 * @property {string} metaTitle - SEO meta title
 * @property {string} metaDescription - SEO meta description
 * @property {string} metaKeywords - SEO keywords
 *
 * @param {UpdatePost} request.body.required - Post data to update
 *
 * @return {object} 200 - Post updated successfully
 * @return {object} 400 - Validation error
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Post not found
 *
 * @example request - Update post payload
 * {
 *   "title": "Updated Title",
 *   "status": "published"
 * }
 *
 * @example response - 200 - Success response
 * {
 *   "message": "Post updated successfully",
 *   "result": {
 *     "id": "uuid",
 *     "title": "Updated Title",
 *     "status": "published",
 *     ...
 *   }
 * }
 */
router.put(
	'/posts/:id',
	authorizationMiddleware,
	requestValidator({
		requestType: 'body',
		type: request.updatePostValidation
	}),
	requestHandler(controller.updatePost)
);

/**
 * DELETE /posts/:id
 * @tags Posts
 * @security BearerAuth
 * @summary Delete a post
 * @description Permanently delete a post. Requires authentication.
 *
 * @param {string} id.path.required - Post ID (UUID)
 *
 * @return {object} 200 - Post deleted successfully
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Post not found
 *
 * @example response - 200 - Success response
 * {
 *   "message": "Post deleted successfully",
 *   "result": null
 * }
 */
router.delete(
	'/posts/:id',
	authorizationMiddleware,
	requestHandler(controller.deletePost)
);

/**
 * PATCH /posts/:id/status
 * @tags Posts
 * @security BearerAuth
 * @summary Update post status
 * @description Quick update for post status only. Useful for publish/unpublish actions.
 *
 * @param {string} id.path.required - Post ID (UUID)
 *
 * @typedef {object} UpdateStatus
 * @property {string} status.required.enum:draft,published,archived - New post status
 *
 * @param {UpdateStatus} request.body.required - Status data
 *
 * @return {object} 200 - Status updated successfully
 * @return {object} 400 - Validation error
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Post not found
 *
 * @example request - Update status payload
 * {
 *   "status": "published"
 * }
 *
 * @example response - 200 - Success response
 * {
 *   "message": "Post status updated to published",
 *   "result": {
 *     "id": "uuid",
 *     "status": "published",
 *     "publishedAt": "2025-10-22T10:30:00Z",
 *     ...
 *   }
 * }
 */
router.patch(
	'/posts/:id/status',
	authorizationMiddleware,
	requestValidator({
		requestType: 'body',
		type: request.updatePostStatusValidation
	}),
	requestHandler(controller.updatePostStatus)
);

export default router;

