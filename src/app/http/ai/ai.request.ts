import * as v from 'valibot';

/**
 * Content Generation Request Validation
 */
export const createContentGenerationValidation = v.object({
	title: v.optional(v.string('Title must be a string')),
	topic: v.optional(v.string('Topic must be a string')),
	keywords: v.optional(v.array(v.string(), 'Keywords must be an array of strings')),
	contentType: v.optional(v.picklist(['blog', 'article', 'tutorial', 'news', 'review'], 'Invalid content type')),
	tone: v.optional(v.picklist(['professional', 'casual', 'friendly', 'technical', 'creative'], 'Invalid tone')),
	length: v.optional(v.picklist(['short', 'medium', 'long'], 'Invalid length')),
	language: v.optional(v.picklist(['id', 'en'], 'Invalid language'))
});

/**
 * SEO Optimization Request Validation
 */
export const createSEOOptimizationValidation = v.object({
	title: v.string('Title is required'),
	content: v.string('Content is required'),
	targetKeywords: v.optional(v.array(v.string(), 'Target keywords must be an array of strings'))
});

/**
 * Image Generation Request Validation
 */
export const createImageGenerationValidation = v.object({
	prompt: v.string('Prompt is required'),
	style: v.optional(v.picklist(['photographic', 'artistic', 'minimalist', 'vintage'], 'Invalid style')),
	size: v.optional(v.picklist(['small', 'medium', 'large'], 'Invalid size')),
	aspectRatio: v.optional(v.picklist(['1:1', '16:9', '4:3', '3:2'], 'Invalid aspect ratio'))
});

/**
 * Auto-tagging Request Validation
 */
export const createAutoTaggingValidation = v.object({
	title: v.string('Title is required'),
	content: v.string('Content is required'),
	existingTags: v.optional(v.array(v.string(), 'Existing tags must be an array of strings'))
});

/**
 * Content Suggestions Query Validation
 */
export const createContentSuggestionsQueryValidation = v.object({
	topic: v.string('Topic is required'),
	contentType: v.optional(v.picklist(['blog', 'article', 'tutorial', 'news', 'review'], 'Invalid content type')),
	language: v.optional(v.picklist(['id', 'en'], 'Invalid language'))
});

export default {
	createContentGenerationValidation,
	createSEOOptimizationValidation,
	createImageGenerationValidation,
	createAutoTaggingValidation,
	createContentSuggestionsQueryValidation
};
