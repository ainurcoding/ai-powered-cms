import { getTextModel, getImageModel, validateAIConfig } from '@/libs/config/ai';
import logger from '@/libs/core/logger';

// AI Service Interfaces
export interface IContentGenerationRequest {
	title?: string;
	topic?: string;
	keywords?: string[];
	contentType: 'blog' | 'article' | 'tutorial' | 'news' | 'review';
	tone: 'professional' | 'casual' | 'friendly' | 'technical' | 'creative';
	length: 'short' | 'medium' | 'long';
	language: 'id' | 'en';
}

export interface IContentGenerationResponse {
	title: string;
	content: string;
	excerpt: string;
	metaDescription: string;
	suggestedTags: string[];
	suggestedCategory: string;
	seoScore: number;
	estimatedReadTime: number;
}

export interface ISEOOptimizationRequest {
	title: string;
	content: string;
	targetKeywords?: string[];
}

export interface ISEOOptimizationResponse {
	optimizedTitle: string;
	metaDescription: string;
	suggestedKeywords: string[];
	seoScore: number;
	improvements: string[];
}

export interface IImageGenerationRequest {
	prompt: string;
	style?: 'photographic' | 'artistic' | 'minimalist' | 'vintage';
	size?: 'small' | 'medium' | 'large';
	aspectRatio?: '1:1' | '16:9' | '4:3' | '3:2';
}

export interface IImageGenerationResponse {
	imageUrl: string;
	prompt: string;
	style: string;
	dimensions: { width: number; height: number };
}

export interface IAutoTaggingRequest {
	title: string;
	content: string;
	existingTags?: string[];
}

export interface IAutoTaggingResponse {
	suggestedTags: string[];
	confidence: number;
	reasoning: string;
}

/**
 * AI Content Generation Service
 */
export class AIService {
	private static instance: AIService;
	
	private constructor() {
		// Don't validate config in constructor - do it lazily
	}
	
	public static getInstance(): AIService {
		if (!AIService.instance) {
			AIService.instance = new AIService();
		}
		return AIService.instance;
	}

	/**
	 * Validate AI configuration (lazy validation)
	 */
	private validateConfig(): void {
		validateAIConfig();
	}

	/**
	 * Generate content using AI
	 */
	async generateContent(request: IContentGenerationRequest): Promise<IContentGenerationResponse> {
		try {
			this.validateConfig();
			const model = getTextModel();
			
			const prompt = this.buildContentPrompt(request);
			logger.info('AI Prompt:', prompt);
			
			const result = await model.generateContent(prompt);
			const response = await result.response;
			const text = response.text();
			
			logger.info('AI Response:', text);
			
			return this.parseContentResponse(text, request);
		} catch (error) {
			logger.error('AI Content Generation failed:', error);
			throw new Error('Failed to generate content with AI');
		}
	}

	/**
	 * Optimize content for SEO
	 */
	async optimizeSEO(request: ISEOOptimizationRequest): Promise<ISEOOptimizationResponse> {
		try {
			this.validateConfig();
			const model = getTextModel();
			
			const prompt = this.buildSEOPrompt(request);
			const result = await model.generateContent(prompt);
			const response = await result.response;
			const text = response.text();
			
			return this.parseSEOResponse(text, request);
		} catch (error) {
			logger.error('AI SEO Optimization failed:', error);
			throw new Error('Failed to optimize SEO with AI');
		}
	}

	/**
	 * Generate image using AI
	 */
	async generateImage(request: IImageGenerationRequest): Promise<IImageGenerationResponse> {
		try {
			this.validateConfig();
			const model = getImageModel();
			
			const prompt = this.buildImagePrompt(request);
			const result = await model.generateContent(prompt);
			const response = await result.response;
			const text = response.text();
			
			return this.parseImageResponse(text, request);
		} catch (error) {
			logger.error('AI Image Generation failed:', error);
			throw new Error('Failed to generate image with AI');
		}
	}

	/**
	 * Auto-tagging for content
	 */
	async autoTagging(request: IAutoTaggingRequest): Promise<IAutoTaggingResponse> {
		try {
			this.validateConfig();
			const model = getTextModel();
			
			const prompt = this.buildTaggingPrompt(request);
			const result = await model.generateContent(prompt);
			const response = await result.response;
			const text = response.text();
			
			return this.parseTaggingResponse(text, request);
		} catch (error) {
			logger.error('AI Auto-tagging failed:', error);
			throw new Error('Failed to generate tags with AI');
		}
	}

	/**
	 * Build content generation prompt
	 */
	private buildContentPrompt(request: IContentGenerationRequest): string {
		const { title, topic, keywords, contentType, tone, length, language } = request;
		
		const lang = language === 'id' ? 'Indonesian' : 'English';
		const lengthWords = length === 'short' ? '300-500' : length === 'medium' ? '800-1200' : '1500-2500';
		
		return `
Generate a ${contentType} content in ${lang} with the following requirements:

${title ? `Title: ${title}` : `Topic: ${topic}`}
${keywords ? `Keywords: ${keywords.join(', ')}` : ''}
Content Type: ${contentType}
Tone: ${tone}
Length: ${lengthWords} words
Language: ${lang}

Please provide the response in the following JSON format:
{
  "title": "Generated title",
  "content": "Full article content with proper formatting",
  "excerpt": "Short summary (100-150 words)",
  "metaDescription": "SEO meta description (150-160 characters)",
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "suggestedCategory": "category name",
  "seoScore": 85,
  "estimatedReadTime": 5
}

Make sure the content is engaging, well-structured, and optimized for web reading.
		`.trim();
	}

	/**
	 * Build SEO optimization prompt
	 */
	private buildSEOPrompt(request: ISEOOptimizationRequest): string {
		const { title, content, targetKeywords } = request;
		
		return `
Optimize the following content for SEO:

Title: ${title}
Content: ${content.substring(0, 1000)}...
${targetKeywords ? `Target Keywords: ${targetKeywords.join(', ')}` : ''}

Please provide the response in the following JSON format:
{
  "optimizedTitle": "SEO-optimized title",
  "metaDescription": "SEO meta description (150-160 characters)",
  "suggestedKeywords": ["keyword1", "keyword2", "keyword3"],
  "seoScore": 90,
  "improvements": ["improvement1", "improvement2", "improvement3"]
}

Focus on improving search engine visibility and user engagement.
		`.trim();
	}

	/**
	 * Build image generation prompt
	 */
	private buildImagePrompt(request: IImageGenerationRequest): string {
		const { prompt, style, size, aspectRatio } = request;
		
		return `
Generate a ${style} style image for: ${prompt}
Size: ${size}
Aspect Ratio: ${aspectRatio}

Please provide the response in the following JSON format:
{
  "imageUrl": "generated_image_url",
  "prompt": "original_prompt",
  "style": "${style}",
  "dimensions": {"width": 1024, "height": 768}
}

Create a high-quality, relevant image that matches the description.
		`.trim();
	}

	/**
	 * Build auto-tagging prompt
	 */
	private buildTaggingPrompt(request: IAutoTaggingRequest): string {
		const { title, content, existingTags } = request;
		
		return `
Analyze the following content and suggest relevant tags:

Title: ${title}
Content: ${content.substring(0, 1000)}...
${existingTags ? `Existing Tags: ${existingTags.join(', ')}` : ''}

Please provide the response in the following JSON format:
{
  "suggestedTags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "confidence": 85,
  "reasoning": "Brief explanation of tag selection"
}

Focus on relevant, specific tags that improve content discoverability.
		`.trim();
	}

	/**
	 * Parse content generation response
	 */
	private parseContentResponse(text: string, request: IContentGenerationRequest): IContentGenerationResponse {
		try {
			// Try to extract JSON from response
			const jsonMatch = text.match(/\{[\s\S]*\}/);
			
			if (jsonMatch) {
				// If JSON found, parse it
				const parsed = JSON.parse(jsonMatch[0]);
				return {
					title: parsed.title || request.title || request.topic || 'Generated Title',
					content: parsed.content || text,
					excerpt: parsed.excerpt || this.generateExcerpt(text),
					metaDescription: parsed.metaDescription || this.generateMetaDescription(text),
					suggestedTags: parsed.suggestedTags || this.extractTags(text),
					suggestedCategory: parsed.suggestedCategory || 'General',
					seoScore: parsed.seoScore || 75,
					estimatedReadTime: parsed.estimatedReadTime || this.calculateReadTime(text)
				};
			} else {
				// If no JSON found, create response from raw text
				return {
					title: request.title || request.topic || 'Generated Title',
					content: text,
					excerpt: this.generateExcerpt(text),
					metaDescription: this.generateMetaDescription(text),
					suggestedTags: this.extractTags(text),
					suggestedCategory: 'General',
					seoScore: 75,
					estimatedReadTime: this.calculateReadTime(text)
				};
			}
		} catch (error) {
			logger.error('Failed to parse content response:', error);
			// Fallback to basic response
			return {
				title: request.title || request.topic || 'Generated Title',
				content: text,
				excerpt: this.generateExcerpt(text),
				metaDescription: this.generateMetaDescription(text),
				suggestedTags: this.extractTags(text),
				suggestedCategory: 'General',
				seoScore: 75,
				estimatedReadTime: this.calculateReadTime(text)
			};
		}
	}

	/**
	 * Parse SEO optimization response
	 */
	private parseSEOResponse(text: string, request: ISEOOptimizationRequest): ISEOOptimizationResponse {
		try {
			const jsonMatch = text.match(/\{[\s\S]*\}/);
			if (!jsonMatch) {
				throw new Error('Invalid AI response format');
			}
			
			const parsed = JSON.parse(jsonMatch[0]);
			
			return {
				optimizedTitle: parsed.optimizedTitle || request.title,
				metaDescription: parsed.metaDescription || '',
				suggestedKeywords: parsed.suggestedKeywords || [],
				seoScore: parsed.seoScore || 0,
				improvements: parsed.improvements || []
			};
		} catch (error) {
			logger.error('Failed to parse SEO response:', error);
			throw new Error('Invalid AI response format');
		}
	}

	/**
	 * Parse image generation response
	 */
	private parseImageResponse(text: string, request: IImageGenerationRequest): IImageGenerationResponse {
		try {
			const jsonMatch = text.match(/\{[\s\S]*\}/);
			if (!jsonMatch) {
				throw new Error('Invalid AI response format');
			}
			
			const parsed = JSON.parse(jsonMatch[0]);
			
			return {
				imageUrl: parsed.imageUrl || '',
				prompt: parsed.prompt || request.prompt,
				style: parsed.style || request.style || 'photographic',
				dimensions: parsed.dimensions || { width: 1024, height: 768 }
			};
		} catch (error) {
			logger.error('Failed to parse image response:', error);
			throw new Error('Invalid AI response format');
		}
	}

	/**
	 * Parse auto-tagging response
	 */
	private parseTaggingResponse(text: string, _request: IAutoTaggingRequest): IAutoTaggingResponse {
		try {
			const jsonMatch = text.match(/\{[\s\S]*\}/);
			if (!jsonMatch) {
				throw new Error('Invalid AI response format');
			}
			
			const parsed = JSON.parse(jsonMatch[0]);
			
			return {
				suggestedTags: parsed.suggestedTags || [],
				confidence: parsed.confidence || 0,
				reasoning: parsed.reasoning || ''
			};
		} catch (error) {
			logger.error('Failed to parse tagging response:', error);
			throw new Error('Invalid AI response format');
		}
	}

	/**
	 * Generate excerpt from content
	 */
	private generateExcerpt(content: string): string {
		// Remove markdown formatting and get first 150 characters
		const cleanContent = content.replace(/[#*`_~]/g, '').trim();
		return cleanContent.length > 150 ? cleanContent.substring(0, 150) + '...' : cleanContent;
	}

	/**
	 * Generate meta description from content
	 */
	private generateMetaDescription(content: string): string {
		// Remove markdown formatting and get first 160 characters
		const cleanContent = content.replace(/[#*`_~]/g, '').trim();
		return cleanContent.length > 160 ? cleanContent.substring(0, 160) + '...' : cleanContent;
	}

	/**
	 * Extract tags from content
	 */
	private extractTags(content: string): string[] {
		// Simple keyword extraction (can be improved with NLP)
		const words = content.toLowerCase()
			.replace(/[^\w\s]/g, ' ')
			.split(/\s+/)
			.filter(word => word.length > 3)
			.filter(word => !['yang', 'dari', 'dengan', 'untuk', 'dalam', 'adalah', 'akan', 'telah', 'sudah'].includes(word));
		
		// Get unique words and return top 5
		const uniqueWords = [...new Set(words)];
		return uniqueWords.slice(0, 5);
	}

	/**
	 * Calculate estimated read time
	 */
	private calculateReadTime(content: string): number {
		const wordsPerMinute = 200;
		const wordCount = content.split(/\s+/).length;
		return Math.ceil(wordCount / wordsPerMinute);
	}
}

// Export singleton instance
export const aiService = AIService.getInstance();
export default aiService;
