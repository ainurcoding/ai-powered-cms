import { InferOutput, object, string, optional, minLength, maxLength, pipe, transform } from 'valibot';
import { ERROR_VALIDATION_MSG } from '@/libs/config/errorMessage';

// Validation for creating a tag
const createTagValidation = object({
	name: pipe(
		string(ERROR_VALIDATION_MSG.string('name')),
		minLength(2, 'Name must be at least 2 characters'),
		maxLength(50, 'Name must not exceed 50 characters')
	)
});
export type TCreateTagValidation = InferOutput<typeof createTagValidation>;

// Validation for updating a tag
const updateTagValidation = object({
	name: pipe(
		string(ERROR_VALIDATION_MSG.string('name')),
		minLength(2, 'Name must be at least 2 characters'),
		maxLength(50, 'Name must not exceed 50 characters')
	)
});
export type TUpdateTagValidation = InferOutput<typeof updateTagValidation>;

// Validation for list tags query
const listTagsQueryValidation = object({
	page: optional(pipe(string(), transform(Number)), '1'),
	limit: optional(pipe(string(), transform(Number)), '50'),
	search: optional(string()),
	sortBy: optional(string()),
	includeCount: optional(string())
});
export type TListTagsQueryValidation = InferOutput<typeof listTagsQueryValidation>;

// Validation for tag suggestions
const tagSuggestionsQueryValidation = object({
	q: string('Search query is required'),
	limit: optional(pipe(string(), transform(Number)), '5')
});
export type TTagSuggestionsQueryValidation = InferOutput<typeof tagSuggestionsQueryValidation>;

export default {
	createTagValidation,
	updateTagValidation,
	listTagsQueryValidation,
	tagSuggestionsQueryValidation
};

