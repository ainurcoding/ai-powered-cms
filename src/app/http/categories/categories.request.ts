import { InferOutput, object, string, optional, minLength, maxLength, pipe, transform } from 'valibot';
import { ERROR_VALIDATION_MSG } from '@/libs/config/errorMessage';

// Validation for creating a category
const createCategoryValidation = object({
	name: pipe(
		string(ERROR_VALIDATION_MSG.string('name')),
		minLength(2, 'Name must be at least 2 characters'),
		maxLength(100, 'Name must not exceed 100 characters')
	),
	description: optional(string()),
	parentId: optional(string('Parent ID must be a string'))
});
export type TCreateCategoryValidation = InferOutput<typeof createCategoryValidation>;

// Validation for updating a category
const updateCategoryValidation = object({
	name: optional(
		pipe(
			string(ERROR_VALIDATION_MSG.string('name')),
			minLength(2, 'Name must be at least 2 characters'),
			maxLength(100, 'Name must not exceed 100 characters')
		)
	),
	description: optional(string()),
	parentId: optional(string('Parent ID must be a string'))
});
export type TUpdateCategoryValidation = InferOutput<typeof updateCategoryValidation>;

// Validation for list categories query
const listCategoriesQueryValidation = object({
	page: optional(pipe(string(), transform(Number)), '1'),
	limit: optional(pipe(string(), transform(Number)), '50'),
	parent: optional(string()),
	includeCount: optional(string())
});
export type TListCategoriesQueryValidation = InferOutput<typeof listCategoriesQueryValidation>;

export default {
	createCategoryValidation,
	updateCategoryValidation,
	listCategoriesQueryValidation
};

