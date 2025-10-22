import { InferOutput, object, string, optional, array, picklist, minLength, maxLength, pipe, transform } from 'valibot';
import { ERROR_VALIDATION_MSG } from '@/libs/config/errorMessage';

// Validation for creating a new post
const createPostValidation = object({
	title: pipe(
		string(ERROR_VALIDATION_MSG.string('title')),
		minLength(3, 'Title must be at least 3 characters'),
		maxLength(255, 'Title must not exceed 255 characters')
	),
	content: pipe(
		string(ERROR_VALIDATION_MSG.string('content')),
		minLength(10, 'Content must be at least 10 characters')
	),
	excerpt: optional(
		pipe(
			string(),
			maxLength(500, 'Excerpt must not exceed 500 characters')
		)
	),
	status: optional(picklist(['draft', 'published', 'archived'], 'Status must be draft, published, or archived')),
	featuredImage: optional(string()),
	categoryId: optional(string('Category ID must be a string')),
	tagIds: optional(array(string(), 'Tag IDs must be an array of strings')),
	// SEO fields
	metaTitle: optional(
		pipe(
			string(),
			maxLength(255, 'Meta title must not exceed 255 characters')
		)
	),
	metaDescription: optional(
		pipe(
			string(),
			maxLength(500, 'Meta description must not exceed 500 characters')
		)
	),
	metaKeywords: optional(string())
});
export type TCreatePostValidation = InferOutput<typeof createPostValidation>;

// Validation for updating a post (all fields optional)
const updatePostValidation = object({
	title: optional(
		pipe(
			string(ERROR_VALIDATION_MSG.string('title')),
			minLength(3, 'Title must be at least 3 characters'),
			maxLength(255, 'Title must not exceed 255 characters')
		)
	),
	content: optional(
		pipe(
			string(ERROR_VALIDATION_MSG.string('content')),
			minLength(10, 'Content must be at least 10 characters')
		)
	),
	excerpt: optional(
		pipe(
			string(),
			maxLength(500, 'Excerpt must not exceed 500 characters')
		)
	),
	status: optional(picklist(['draft', 'published', 'archived'], 'Status must be draft, published, or archived')),
	featuredImage: optional(string()),
	categoryId: optional(string('Category ID must be a string')),
	tagIds: optional(array(string(), 'Tag IDs must be an array of strings')),
	// SEO fields
	metaTitle: optional(
		pipe(
			string(),
			maxLength(255, 'Meta title must not exceed 255 characters')
		)
	),
	metaDescription: optional(
		pipe(
			string(),
			maxLength(500, 'Meta description must not exceed 500 characters')
		)
	),
	metaKeywords: optional(string())
});
export type TUpdatePostValidation = InferOutput<typeof updatePostValidation>;

// Validation for updating post status only
const updatePostStatusValidation = object({
	status: picklist(['draft', 'published', 'archived'], 'Status must be draft, published, or archived')
});
export type TUpdatePostStatusValidation = InferOutput<typeof updatePostStatusValidation>;

// Validation for list posts query parameters
const listPostsQueryValidation = object({
	page: optional(pipe(string(), transform(Number)), '1'),
	limit: optional(pipe(string(), transform(Number)), '10'),
	status: optional(picklist(['draft', 'published', 'archived'])),
	category: optional(string()),
	tag: optional(string()),
	author: optional(string()),
	search: optional(string()),
	sortBy: optional(picklist(['created_at', 'updated_at', 'title', 'published_at'])),
	sortOrder: optional(picklist(['asc', 'desc']))
});
export type TListPostsQueryValidation = InferOutput<typeof listPostsQueryValidation>;

export default {
	createPostValidation,
	updatePostValidation,
	updatePostStatusValidation,
	listPostsQueryValidation
};

