import { InferOutput, object, string, optional, pipe, transform } from 'valibot';

// Validation for list media query
const listMediaQueryValidation = object({
	page: optional(pipe(string(), transform(Number)), '1'),
	limit: optional(pipe(string(), transform(Number)), '20'),
	type: optional(string()),
	folder: optional(string()),
	search: optional(string()),
	sortBy: optional(string()),
	sortOrder: optional(string())
});
export type TListMediaQueryValidation = InferOutput<typeof listMediaQueryValidation>;

export default {
	listMediaQueryValidation
};

