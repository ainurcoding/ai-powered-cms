import { TRequestFunction, InvalidParameterException } from '@/libs/core';
import { aiService, IContentGenerationRequest, ISEOOptimizationRequest, IImageGenerationRequest, IAutoTaggingRequest, IContentSuggestionsRequest } from '@/libs/services/aiService';

/**
 * Generate content using AI
 */
const generateContent: TRequestFunction = async (req) => {
	const request: IContentGenerationRequest = {
		title: req.body.title,
		topic: req.body.topic,
		keywords: req.body.keywords || [],
		contentType: req.body.contentType || 'blog',
		tone: req.body.tone || 'professional',
		length: req.body.length || 'medium',
		language: req.body.language || 'id'
	};

	const result = await aiService.generateContent(request);

	return {
		message: 'Content generated successfully',
		result
	};
};

/**
 * Optimize content for SEO
 */
const optimizeSEO: TRequestFunction = async (req) => {
	const request: ISEOOptimizationRequest = {
		title: req.body.title,
		content: req.body.content,
		targetKeywords: req.body.targetKeywords || []
	};

	const result = await aiService.optimizeSEO(request);

	return {
		message: 'SEO optimization completed',
		result
	};
};

/**
 * Generate image using AI
 */
const generateImage: TRequestFunction = async (req) => {
	const request: IImageGenerationRequest = {
		prompt: req.body.prompt,
		style: req.body.style || 'photographic',
		size: req.body.size || 'medium',
		aspectRatio: req.body.aspectRatio || '16:9'
	};

	const result = await aiService.generateImage(request);

	return {
		message: 'Image generated successfully',
		result
	};
};

/**
 * Auto-tagging for content
 */
const autoTagging: TRequestFunction = async (req) => {
	const request: IAutoTaggingRequest = {
		title: req.body.title,
		content: req.body.content,
		existingTags: req.body.existingTags || []
	};

	const result = await aiService.autoTagging(request);

	return {
		message: 'Auto-tagging completed',
		result
	};
};

/**
 * Get AI service status
 */
const getStatus: TRequestFunction = async (_req) => {
	const status = {
		service: 'AI Service',
		status: 'active',
		features: [
			'Content Generation',
			'SEO Optimization',
			'Image Generation',
			'Auto-tagging'
		],
		models: {
			text: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
			image: process.env.AI_IMAGE_MODEL || 'gemini-2.5-flash'
		},
		timestamp: new Date().toISOString(),
		apiKey: process.env.GEMINI_API_KEY ? 'configured' : 'missing'
	};

	return {
		message: 'AI service status',
		result: status
	};
};

/**
 * Get content suggestions
 */
const getContentSuggestions: TRequestFunction = async (req) => {
	const { topic, contentType, language, count } = req.query;

	if (!topic) {
		throw new InvalidParameterException('Topic is required');
	}

	// Generate content suggestions using AI
	const request: IContentSuggestionsRequest = {
		topic: topic as string,
		contentType: (contentType as any) || 'blog',
		language: (language as any) || 'id',
		count: count ? parseInt(count as string) : 5
	};

	const result = await aiService.generateContentSuggestions(request);

	return {
		message: 'Content suggestions generated successfully',
		result: {
			suggestions: result.suggestions,
			totalSuggestions: result.totalSuggestions,
			topic: topic as string,
			contentType: contentType || 'blog',
			language: language || 'id'
		}
	};
};

export default {
	generateContent,
	optimizeSEO,
	generateImage,
	autoTagging,
	getStatus,
	getContentSuggestions
};
