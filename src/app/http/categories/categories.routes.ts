import { Router } from 'express';
import { requestHandler, requestValidator } from '@/libs/core';
import authorizationMiddleware from '@/libs/middlewares/authorization.middleware';
import controller from './categories.controller';
import request from './categories.request';

const router = Router();

/**
 * GET /categories
 * @tags Categories
 * @summary List all categories
 * @description Get paginated list of categories with optional hierarchical structure and post counts
 *
 * @param {number} page.query - Page number (default: 1)
 * @param {number} limit.query - Items per page (default: 50, max: 100)
 * @param {string} parent.query - Filter by parent ID (use 'null' for root categories only)
 * @param {string} includeCount.query - Include post count per category (true/false)
 *
 * @return {object} 200 - Success response with categories array
 * @return {object} 400 - Bad request
 *
 * @example response - 200 - Success response with hierarchy
 * {
 *   "message": "Categories retrieved successfully",
 *   "result": [
 *     {
 *       "id": "uuid",
 *       "name": "Programming",
 *       "slug": "programming",
 *       "description": "Programming tutorials and guides",
 *       "parent_id": null,
 *       "post_count": 45,
 *       "children": [
 *         {
 *           "id": "uuid",
 *           "name": "JavaScript",
 *           "slug": "javascript",
 *           "parent_id": "parent-uuid",
 *           "post_count": 23
 *         }
 *       ],
 *       "created_at": "2025-10-22T10:30:00Z"
 *     }
 *   ],
 *   "meta": {
 *     "page": 1,
 *     "limit": 50,
 *     "total": 12,
 *     "totalPages": 1,
 *     "hasNextPage": false,
 *     "hasPrevPage": false
 *   }
 * }
 */
router.get(
	'/categories',
	requestValidator({
		requestType: 'query',
		type: request.listCategoriesQueryValidation
	}),
	requestHandler(controller.listCategories)
);

/**
 * GET /categories/:id
 * @tags Categories
 * @summary Get single category by ID
 * @description Retrieve detailed information about a specific category including parent, children, and optionally recent posts
 *
 * @param {string} id.path.required - Category ID (UUID)
 * @param {string} includePosts.query - Include recent posts (true/false, default: false)
 * @param {number} postsLimit.query - Number of posts to include (default: 5, max: 20)
 *
 * @return {object} 200 - Success response with category details
 * @return {object} 404 - Category not found
 *
 * @example response - 200 - Success response
 * {
 *   "message": "Category retrieved successfully",
 *   "result": {
 *     "id": "uuid",
 *     "name": "Programming",
 *     "slug": "programming",
 *     "description": "Programming tutorials and guides",
 *     "parent_id": null,
 *     "parent_name": null,
 *     "post_count": 45,
 *     "children": [
 *       {
 *         "id": "uuid",
 *         "name": "JavaScript",
 *         "slug": "javascript",
 *         "post_count": 23
 *       }
 *     ],
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
	'/categories/:id',
	requestHandler(controller.getCategory)
);

/**
 * POST /categories
 * @tags Categories
 * @security BearerAuth
 * @summary Create a new category
 * @description Create a new category. Only administrators can create categories.
 *
 * @typedef {object} CreateCategory
 * @property {string} name.required - Category name (2-100 characters)
 * @property {string} description - Category description
 * @property {string} parentId - Parent category ID (UUID) for subcategory
 *
 * @param {CreateCategory} request.body.required - Category data
 *
 * @return {object} 200 - Category created successfully
 * @return {object} 400 - Validation error
 * @return {object} 401 - Unauthorized
 * @return {object} 403 - Forbidden (admin only)
 *
 * @example request - Create root category
 * {
 *   "name": "Technology",
 *   "description": "All about technology and innovation"
 * }
 *
 * @example request - Create subcategory
 * {
 *   "name": "JavaScript",
 *   "description": "JavaScript tutorials",
 *   "parentId": "parent-category-uuid"
 * }
 *
 * @example response - 200 - Success response
 * {
 *   "message": "Category created successfully",
 *   "result": {
 *     "id": "uuid",
 *     "name": "Technology",
 *     "slug": "technology",
 *     "description": "All about technology and innovation",
 *     "parent_id": null,
 *     "created_at": "2025-10-22T10:30:00Z"
 *   }
 * }
 */
router.post(
	'/categories',
	authorizationMiddleware,
	requestValidator({
		requestType: 'body',
		type: request.createCategoryValidation
	}),
	requestHandler(controller.createCategory)
);

/**
 * PUT /categories/:id
 * @tags Categories
 * @security BearerAuth
 * @summary Update a category
 * @description Update an existing category. Only administrators can update categories.
 *
 * @param {string} id.path.required - Category ID (UUID)
 *
 * @typedef {object} UpdateCategory
 * @property {string} name - Category name (2-100 characters)
 * @property {string} description - Category description
 * @property {string} parentId - Parent category ID (UUID, use null to make root category)
 *
 * @param {UpdateCategory} request.body.required - Category data to update
 *
 * @return {object} 200 - Category updated successfully
 * @return {object} 400 - Validation error
 * @return {object} 401 - Unauthorized
 * @return {object} 403 - Forbidden (admin only)
 * @return {object} 404 - Category not found
 *
 * @example request - Update category
 * {
 *   "name": "Updated Category Name",
 *   "description": "Updated description"
 * }
 *
 * @example response - 200 - Success response
 * {
 *   "message": "Category updated successfully",
 *   "result": {
 *     "id": "uuid",
 *     "name": "Updated Category Name",
 *     "slug": "updated-category-name",
 *     "description": "Updated description",
 *     "parent_id": null,
 *     "updated_at": "2025-10-22T10:30:00Z"
 *   }
 * }
 */
router.put(
	'/categories/:id',
	authorizationMiddleware,
	requestValidator({
		requestType: 'body',
		type: request.updateCategoryValidation
	}),
	requestHandler(controller.updateCategory)
);

/**
 * DELETE /categories/:id
 * @tags Categories
 * @security BearerAuth
 * @summary Delete a category
 * @description Delete a category. Only administrators can delete categories. Cannot delete if category has posts or subcategories.
 *
 * @param {string} id.path.required - Category ID (UUID)
 *
 * @return {object} 200 - Category deleted successfully
 * @return {object} 400 - Cannot delete (has posts or subcategories)
 * @return {object} 401 - Unauthorized
 * @return {object} 403 - Forbidden (admin only)
 * @return {object} 404 - Category not found
 *
 * @example response - 200 - Success response
 * {
 *   "message": "Category deleted successfully",
 *   "result": null
 * }
 *
 * @example response - 400 - Cannot delete
 * {
 *   "message": "Cannot delete category that has posts. Please reassign or delete posts first."
 * }
 */
router.delete(
	'/categories/:id',
	authorizationMiddleware,
	requestHandler(controller.deleteCategory)
);

export default router;

