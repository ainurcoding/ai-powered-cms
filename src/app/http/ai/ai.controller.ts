import { TRequestFunction, InvalidParameterException } from '@/libs/core';
import { aiService, IContentGenerationRequest, ISEOOptimizationRequest, IImageGenerationRequest, IAutoTaggingRequest } from '@/libs/services/aiService';
import logger from '@/libs/core/logger';

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
const getStatus: TRequestFunction = async (req) => {
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
			text: 'gemini-1.5-flash',
			image: 'gemini-1.5-flash'
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
	const { topic, contentType, language } = req.query;

	if (!topic) {
		throw new InvalidParameterException('Topic is required');
	}

	// Generate content suggestions using AI
	const request: IContentGenerationRequest = {
		topic: topic as string,
		contentType: (contentType as any) || 'blog',
		tone: 'professional',
		length: 'short',
		language: (language as any) || 'id'
	};

	const result = await aiService.generateContent(request);

	// Return suggestions in a different format
	const suggestions = {
		suggestedTitle: result.title,
		suggestedExcerpt: result.excerpt,
		suggestedTags: result.suggestedTags,
		suggestedCategory: result.suggestedCategory,
		estimatedReadTime: result.estimatedReadTime,
		seoScore: result.seoScore
	};

	return {
		message: 'Content suggestions generated',
		result: suggestions
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
