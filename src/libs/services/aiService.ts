import { getTextModel, validateAIConfig } from '@/libs/config/ai';
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
	ttl?: string;
	expiresAt?: string;
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
			
			const result = await model.generateContent(prompt);
			const response = await result.response;
			const text = response.text();
			
			
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
	 * Multi-API fallback system: Hugging Face → OpenAI → Placeholder
	 * Stops at first successful service to save credits
	 */
	async generateImage(request: IImageGenerationRequest): Promise<IImageGenerationResponse> {
		// 1. Try Hugging Face first (if API key exists)
		if (process.env.HUGGINGFACE_API_KEY) {
			try {
				logger.info('Trying Hugging Face API...');
				const result = await this.generateImageWithStableDiffusion(request);
				logger.info('Hugging Face API successful, stopping here to save credits');
				return result;
			} catch (hfError: any) {
				logger.warn('Hugging Face API failed:', hfError.message);
				// Check if it's a credit limit error
				if (hfError.message?.includes('exceeded your monthly included credits') || 
					hfError.message?.includes('402') || 
					hfError.message?.includes('ProviderApiError')) {
					logger.warn('Hugging Face credit limit reached, trying next service...');
				}
			}
		}
		
		// 2. Try OpenAI DALL-E (if API key exists)
		if (process.env.OPENAI_API_KEY) {
			try {
				logger.info('Trying OpenAI DALL-E API...');
				const result = await this.generateImageWithDALLE(request);
				logger.info('OpenAI DALL-E API successful, stopping here to save credits');
				return result;
			} catch (openaiError: any) {
				logger.warn('OpenAI DALL-E API failed:', openaiError.message);
				// Check if it's a credit limit error
				if (openaiError.message?.includes('credit') || 
					openaiError.message?.includes('limit') || 
					openaiError.message?.includes('402')) {
					logger.warn('OpenAI credit limit reached, using placeholder...');
				}
			}
		}
		
		// 3. Fallback to placeholder
		logger.warn('All AI APIs failed or not configured, using placeholder');
		return await this.generatePlaceholderImage(request);
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
Write a detailed ${contentType} article in ${lang} about "${title || topic}".

Requirements:
- Length: ${lengthWords} words
- Tone: ${tone}
- Language: ${lang}
${keywords ? `- Include keywords: ${keywords.join(', ')}` : ''}

Write a comprehensive article with:
- Introduction
- Main content with examples
- Practical tips
- Conclusion

Return ONLY this JSON (no other text):
{
  "title": "Article title",
  "content": "Full article content with HTML tags like <h2>, <h3>, <p>",
  "excerpt": "150-word summary",
  "metaDescription": "SEO description (150-160 chars)",
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "suggestedCategory": "category",
  "seoScore": 85,
  "estimatedReadTime": 5
}
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
			// Try to extract JSON from response (handle both plain JSON and markdown code blocks)
			let jsonMatch = text.match(/\{[\s\S]*\}/);
			
			// If no JSON found, try to extract from markdown code blocks
			if (!jsonMatch) {
				const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
				if (codeBlockMatch) {
					jsonMatch = [codeBlockMatch[1]];
				}
			}
			
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
				// If no JSON found, create a comprehensive response from the topic
				const title = request.title || request.topic || 'Generated Title';
				const content = this.generateComprehensiveContent(request, title);

				return {
					title: title,
					content: content,
					excerpt: this.generateExcerpt(content),
					metaDescription: this.generateMetaDescription(content),
					suggestedTags: this.extractTags(content),
					suggestedCategory: this.getCategoryFromTopic(request.topic || title),
					seoScore: 75,
					estimatedReadTime: this.calculateReadTime(content)
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
	 * Generate enhanced image description
	 */
	private generateImageDescription(request: IImageGenerationRequest): string {
		const { prompt, style, size, aspectRatio } = request;
		
		return `${style} style image showcasing ${prompt}. The image features high-quality ${style} photography with professional lighting and composition. Size: ${size}, Aspect Ratio: ${aspectRatio}. The image is designed to be visually appealing and relevant to the content, with attention to detail and professional presentation.`;
	}

	/**
	 * Calculate image dimensions based on size and aspect ratio
	 */
	private calculateImageDimensions(size: string, aspectRatio: string): { width: number; height: number } {
		let baseSize = 1024;
		
		switch (size) {
			case 'small':
				baseSize = 512;
				break;
			case 'medium':
				baseSize = 1024;
				break;
			case 'large':
				baseSize = 2048;
				break;
			default:
				baseSize = 1024;
		}
		
		switch (aspectRatio) {
			case '1:1':
				return { width: baseSize, height: baseSize };
			case '16:9':
				return { width: baseSize, height: Math.round(baseSize * 9 / 16) };
			case '4:3':
				return { width: baseSize, height: Math.round(baseSize * 3 / 4) };
			case '3:2':
				return { width: baseSize, height: Math.round(baseSize * 2 / 3) };
			default:
				return { width: baseSize, height: Math.round(baseSize * 9 / 16) };
		}
	}

	/**
	 * Generate placeholder image URL that can be accessed
	 */
	private generatePlaceholderImageUrl(request: IImageGenerationRequest, dimensions: { width: number; height: number }): string {
		const { prompt, style } = request;
		
		// Create a descriptive text for the placeholder
		const text = prompt.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 30);
		const encodedText = encodeURIComponent(text);
		
		// Use placehold.co service for accessible images
		const baseUrl = 'https://placehold.co';
		const size = `${dimensions.width}x${dimensions.height}`;
		const color = this.getStyleColor(style);
		
		return `${baseUrl}/${size}/${color}/FFFFFF?text=${encodedText}`;
	}

	/**
	 * Get color based on style
	 */
	private getStyleColor(style: string): string {
		const colorMap: Record<string, string> = {
			'photographic': '4A90E2',      // Blue
			'artistic': 'E74C3C',          // Red
			'minimalist': '95A5A6',        // Gray
			'vintage': '8B4513',           // Brown
			'default': '3498DB'            // Default blue
		};
		
		return colorMap[style] || colorMap['default'];
	}

	/**
	 * Generate image using Hugging Face Inference API with Provider
	 */
	private async generateImageWithStableDiffusion(request: IImageGenerationRequest): Promise<IImageGenerationResponse> {
		try {
			// Import Hugging Face Inference API
			const { HfInference: hfInferenceClass } = await import('@huggingface/inference');
			const hfInference = new hfInferenceClass(process.env.HUGGINGFACE_API_KEY);
			
			// Calculate dimensions
			const dimensions = this.calculateImageDimensions(request.size, request.aspectRatio);
			
			// Enhanced prompt based on style
			const enhancedPrompt = this.buildStableDiffusionPrompt(request);
			
			// Generate image using Hugging Face with provider
			const response = await hfInference.textToImage({
				model: 'black-forest-labs/FLUX.1-dev',
				inputs: enhancedPrompt,
				provider: 'fal-ai', // Use fal-ai provider
				parameters: {
					width: dimensions.width,
					height: dimensions.height,
				}
			});
			
			// Convert blob to base64 URL
			const imageUrl = await this.convertBlobToUrl(response as unknown as Blob);
			
			return {
				imageUrl,
				prompt: enhancedPrompt,
				style: request.style,
				dimensions
			};
			
		} catch (error) {
			logger.error('Hugging Face generation failed:', error);
			throw error;
		}
	}

	/**
	 * Build enhanced prompt for Stable Diffusion
	 */
	private buildStableDiffusionPrompt(request: IImageGenerationRequest): string {
		const { prompt, style } = request;
		
		const stylePrompts: Record<string, string> = {
			'photographic': 'professional photography, high quality, detailed, realistic, sharp focus',
			'artistic': 'artistic, creative, stylized, colorful, expressive',
			'minimalist': 'minimalist, clean, simple, elegant, modern design',
			'vintage': 'vintage, retro, classic, aged, nostalgic',
			'cartoon': 'cartoon style, animated, colorful, fun, playful, character design',
			'sketch': 'pencil sketch, hand-drawn, line art, black and white, artistic drawing'
		};
		
		const stylePrompt = stylePrompts[style] || stylePrompts['photographic'];
		
		return `${prompt}, ${stylePrompt}, high resolution, 4k, detailed`;
	}

	/**
	 * Convert blob to URL and save to storage (Node.js compatible)
	 */
	private async convertBlobToUrl(blob: Blob): Promise<string> {
		try {
			// Convert blob to buffer
			const buffer = await blob.arrayBuffer();
			
			// Save to storage
			const savedPath = await this.saveImageToStorage(buffer);
			
			// Return both base64 and file path
			return savedPath;
		} catch (error) {
			logger.error('Failed to convert blob to URL:', error);
			throw error;
		}
	}

	/**
	 * Save generated image to temporary storage (12 hours TTL)
	 */
	private async saveImageToStorage(buffer: ArrayBuffer): Promise<string> {
		try {
			const fs = await import('fs');
			const path = await import('path');
			const crypto = await import('crypto');
			
			// Generate unique filename with timestamp
			const timestamp = Date.now();
			const randomId = crypto.randomBytes(8).toString('hex');
			const filename = `ai-temp-${timestamp}-${randomId}.png`;
			
			// Create temporary storage directory
			const tempDir = path.join(process.cwd(), 'storage', 'temp', 'ai-images');
			if (!fs.existsSync(tempDir)) {
				fs.mkdirSync(tempDir, { recursive: true });
			}
			
			// Save file
			const filePath = path.join(tempDir, filename);
			fs.writeFileSync(filePath, new Uint8Array(buffer));
			
			// Schedule file deletion after 12 hours
			this.scheduleFileDeletion(filePath, 12 * 60 * 60 * 1000); // 12 hours in milliseconds
			
			// Return public URL
			const publicUrl = `/static/temp/ai-images/${filename}`;
			
			return publicUrl;
		} catch (error) {
			logger.error('Failed to save image to storage:', error);
			throw error;
		}
	}

	/**
	 * Schedule file deletion after specified time
	 */
	private scheduleFileDeletion(filePath: string, delay: number): void {
		setTimeout(() => {
			try {
				const fs = require('fs');
				if (fs.existsSync(filePath)) {
					fs.unlinkSync(filePath);
					logger.info('Temporary AI image deleted:', filePath);
				}
			} catch (error) {
				logger.error('Failed to delete temporary file:', error);
			}
		}, delay);
	}

	/**
	 * Cleanup old temporary files (older than 12 hours)
	 */
	public async cleanupOldTempFiles(): Promise<void> {
		try {
			const fs = await import('fs');
			const path = await import('path');
			
			const tempDir = path.join(process.cwd(), 'storage', 'temp', 'ai-images');
			
			if (!fs.existsSync(tempDir)) {
				return;
			}
			
			const files = fs.readdirSync(tempDir);
			const now = Date.now();
			const maxAge = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
			
			for (const file of files) {
				if (file.startsWith('ai-temp-')) {
					const filePath = path.join(tempDir, file);
					const stats = fs.statSync(filePath);
					const fileAge = now - stats.mtime.getTime();
					
					if (fileAge > maxAge) {
						fs.unlinkSync(filePath);
						logger.info('Cleaned up old temporary file:', file);
					}
				}
			}
		} catch (error) {
			logger.error('Failed to cleanup old temporary files:', error);
		}
	}

	
	
	/**
	 * Save image from URL to temporary storage
	 */
	private async saveImageToStorageFromUrl(imageUrl: string): Promise<string> {
		try {
			const fs = await import('fs');
			const path = await import('path');
			const crypto = await import('crypto');
			
			// Download image from URL
			const response = await fetch(imageUrl);
			if (!response.ok) {
				throw new Error(`Failed to download image: ${response.status}`);
			}
			
			const buffer = await response.arrayBuffer();
			
			// Generate unique filename
			const timestamp = Date.now();
			const randomId = crypto.randomBytes(8).toString('hex');
			const filename = `replicate-${timestamp}-${randomId}.png`;
			
			// Create temporary storage directory
			const tempDir = path.join(process.cwd(), 'storage', 'temp', 'ai-images');
			if (!fs.existsSync(tempDir)) {
				fs.mkdirSync(tempDir, { recursive: true });
			}
			
			// Save file
			const filePath = path.join(tempDir, filename);
			fs.writeFileSync(filePath, new Uint8Array(buffer));
			
			// Schedule file deletion after 12 hours
			this.scheduleFileDeletion(filePath, 12 * 60 * 60 * 1000);
			
			// Return public URL
			return `/static/temp/ai-images/${filename}`;
		} catch (error) {
			logger.error('Failed to save image from URL:', error);
			throw error;
		}
	}
	
	/**
	 * Generate image using OpenAI DALL-E
	 */
	private async generateImageWithDALLE(request: IImageGenerationRequest): Promise<IImageGenerationResponse> {
		const { style = 'photographic', size = 'medium', aspectRatio = '16:9' } = request;
		
		// Build enhanced prompt for DALL-E
		const enhancedPrompt = this.buildStableDiffusionPrompt(request);
		
		// DALL-E API call
		const response = await fetch('https://api.openai.com/v1/images/generations', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				prompt: enhancedPrompt,
				n: 1,
				size: this.getDALLESize(size, aspectRatio),
				quality: 'standard'
			})
		});
		
		if (!response.ok) {
			throw new Error(`OpenAI DALL-E API error: ${response.status} ${response.statusText}`);
		}
		
		const result = await response.json();
		const imageUrl = result.data[0].url;
		
		// Save to temporary storage
		const savedImageUrl = await this.saveImageToStorageFromUrl(imageUrl);
		
		return {
			imageUrl: savedImageUrl,
			prompt: enhancedPrompt,
			style,
			dimensions: this.calculateImageDimensions(size, aspectRatio),
			ttl: '12 hours',
			expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
		};
	}
	
	/**
	 * Get DALL-E size format
	 */
	private getDALLESize(size: string, aspectRatio: string): string {
		const sizeMap: Record<string, string> = {
			'small': '256x256',
			'medium': '512x512',
			'large': '1024x1024'
		};
		
		// DALL-E supports specific sizes
		if (aspectRatio === '1:1') return sizeMap[size] || '512x512';
		if (aspectRatio === '16:9') return '1024x1792';
		if (aspectRatio === '4:3') return '1024x1024';
		if (aspectRatio === '3:2') return '1024x1024';
		
		return '512x512';
	}
	
	/**
	 * Generate placeholder image (fallback)
	 */
	private async generatePlaceholderImage(request: IImageGenerationRequest): Promise<IImageGenerationResponse> {
		// Simulate processing time
		await new Promise(resolve => setTimeout(resolve, 1000));
		
		// Fallback to basic placeholder
		const dimensions = this.calculateImageDimensions(request.size, request.aspectRatio);
		const mockImageUrl = this.generatePlaceholderImageUrl(request, dimensions);
		const enhancedPrompt = this.generateImageDescription(request);
		
		return {
			imageUrl: mockImageUrl,
			prompt: enhancedPrompt,
			style: request.style || 'photographic',
			dimensions,
			ttl: '12 hours',
			expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
		};
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
		// Remove markdown formatting and get first 200 words for better context
		const cleanContent = content.replace(/[#*`_~]/g, '').trim();
		const words = cleanContent.split(/\s+/);
		
		// Return first 200 words for better context, let frontend handle truncation
		return words.slice(0, 200).join(' ');
	}

	/**
	 * Generate meta description from content
	 */
	private generateMetaDescription(content: string): string {
		// Remove markdown formatting and get first 300 words for better context
		const cleanContent = content.replace(/[#*`_~]/g, '').trim();
		const words = cleanContent.split(/\s+/);
		
		// Return first 300 words for better context, let frontend handle truncation
		return words.slice(0, 300).join(' ');
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

	/**
	 * Generate comprehensive content when AI response is not available
	 */
	private generateComprehensiveContent(request: IContentGenerationRequest, title: string): string {
		const { topic, keywords, contentType, language } = request;
		const lang = language === 'id' ? 'Indonesian' : 'English';
		
		// Generate content based on content type
		switch (contentType) {
			case 'tutorial':
				return this.generateTutorialContent(title, topic, keywords, lang);
			case 'blog':
				return this.generateBlogContent(title, topic, keywords, lang);
			case 'article':
				return this.generateArticleContent(title, topic, keywords, lang);
			case 'news':
				return this.generateNewsContent(title, topic, keywords, lang);
			case 'review':
				return this.generateReviewContent(title, topic, keywords, lang);
			default:
				return this.generateDefaultContent(title, topic, keywords, lang);
		}
	}

	/**
	 * Generate tutorial content
	 */
	private generateTutorialContent(title: string, topic: string, keywords: string[], lang: string): string {
		const keywordText = keywords ? keywords.join(', ') : '';
		
		return `# ${title}

## Pengenalan

${topic} adalah topik yang sangat penting untuk dipelajari, terutama bagi pemula. ${lang === 'id' ? 'Dalam tutorial ini' : 'In this tutorial'}, kita akan mempelajari ${topic} dari dasar hingga tingkat yang lebih lanjut.

${keywordText ? `**Kata kunci yang akan dibahas:** ${keywordText}` : ''}

## Yang Akan Anda Pelajari

- Dasar-dasar ${topic}
- Langkah-langkah praktis
- Tips dan trik
- Contoh implementasi
- Troubleshooting umum

## Persiapan

Sebelum memulai, pastikan Anda memiliki:
- Komputer dengan akses internet
- Editor kode (VS Code, Sublime Text, atau yang lainnya)
- Browser modern
- Motivasi untuk belajar!

## Langkah 1: Dasar-dasar

Mari kita mulai dengan memahami konsep dasar dari ${topic}. Ini adalah fondasi yang penting untuk memahami topik yang lebih kompleks.

### Konsep Utama

1. **Definisi**: ${topic} adalah...
2. **Manfaat**: Mengapa penting mempelajari ${topic}?
3. **Aplikasi**: Di mana ${topic} digunakan?

## Langkah 2: Implementasi Praktis

Sekarang kita akan melihat contoh praktis dari ${topic}.

### Contoh Sederhana

\`\`\`javascript
// Contoh kode sederhana
console.log("Hello, ${topic}!");
\`\`\`

### Penjelasan Kode

- Baris 1: Komentar yang menjelaskan kode
- Baris 2: Implementasi dasar

## Langkah 3: Tips dan Best Practices

### Tips untuk Pemula

1. **Mulai dari yang sederhana**: Jangan terburu-buru
2. **Praktik secara konsisten**: Latihan setiap hari
3. **Bergabung dengan komunitas**: Belajar dari yang lain
4. **Buat proyek kecil**: Implementasikan apa yang dipelajari

### Common Mistakes

- Terlalu cepat ingin hasil
- Tidak memahami dasar-dasar
- Tidak praktik dengan cukup
- Menyerah terlalu cepat

## Langkah 4: Proyek Praktis

Mari kita buat proyek sederhana untuk menerapkan ${topic}.

### Proyek: [Nama Proyek Sederhana]

**Tujuan**: Membuat aplikasi sederhana yang menggunakan ${topic}

**Langkah-langkah**:
1. Setup environment
2. Buat struktur dasar
3. Implementasi fitur utama
4. Testing dan debugging
5. Deployment

## Troubleshooting

### Masalah Umum

**Problem**: Error saat menjalankan kode
**Solution**: Periksa syntax dan pastikan semua dependencies terinstall

**Problem**: Hasil tidak sesuai ekspektasi
**Solution**: Debug step by step dan periksa logic

## Kesimpulan

${topic} adalah skill yang sangat berguna dan dapat dipelajari oleh siapa saja. Dengan konsistensi dan praktik yang cukup, Anda akan dapat menguasai ${topic} dengan baik.

### Langkah Selanjutnya

- Eksplorasi fitur-fitur lanjutan
- Bergabung dengan komunitas
- Buat proyek yang lebih kompleks
- Bagikan pengetahuan dengan orang lain

### Sumber Belajar Tambahan

- Dokumentasi resmi
- Video tutorial
- Buku dan artikel
- Komunitas online

---

**Selamat belajar dan semoga sukses dengan ${topic}!** 🚀`;
	}

	/**
	 * Generate blog content
	 */
	private generateBlogContent(title: string, topic: string, keywords: string[], lang: string): string {
		const keywordText = keywords ? keywords.join(', ') : '';
		
		if (lang === 'English') {
			return this.generateEnglishBlogContent(title, topic, keywordText);
		}

		return this.generateIndonesianBlogContent(title, topic, keywordText);
	}

	private generateEnglishBlogContent(title: string, topic: string, keywordText: string): string {
		return `# ${title}

## Introduction

Hello readers! Today we will discuss ${topic}, a very interesting and relevant topic in today's digital era.

${keywordText ? `In this article, we will explore various aspects related to ${keywordText}.` : ''}

## Why is ${topic} Important?

${topic} plays a very important role in our daily lives. Let's look at some reasons why this topic is worth learning and understanding.

### 1. Relevance in the Modern Era

In the rapidly evolving digital age, ${topic} becomes increasingly relevant and important. Many aspects of our lives are influenced by the development of ${topic}.

### 2. Opportunities and Benefits

Understanding ${topic} opens up various opportunities and benefits, both personally and professionally.

## Important Aspects

### Technical Aspects

From a technical standpoint, ${topic} involves various components and concepts that need to be understood:

- **Basics**: Strong foundation
- **Implementation**: How to apply in practice
- **Optimization**: How to get the best results

### Practical Aspects

Practically, ${topic} can be applied in various contexts:

- **Daily use**: Applications in life
- **Professional development**: Career advancement
- **Innovation**: Creating new solutions

## Tips and Suggestions

### For Beginners

If you're new to ${topic}, here are some tips that can help:

1. **Start from the basics**: Don't rush
2. **Consistency**: Learn regularly
3. **Practice**: Apply what you learn
4. **Community**: Join relevant communities

### For Experienced Users

For those already familiar with ${topic}, consider:

- **Exploring advanced aspects**
- **Sharing knowledge**
- **Mentoring others**
- **Exploring latest innovations**

## Trends and Future

### Current Trends

${topic} continues to evolve with exciting new trends:

- **Latest technology**: Innovations that change how we work
- **New methodologies**: More effective approaches
- **Tools and platforms**: Tools that make implementation easier

### Future Predictions

Looking ahead, ${topic} will continue to develop with:

- **Better integration**
- **More sophisticated automation**
- **Wider accessibility**

## Conclusion

${topic} is a very interesting topic with great potential for the future. With good understanding and proper implementation, we can leverage ${topic} to achieve various goals.

### Key Takeaways

- ${topic} plays an important role in the modern era
- Good understanding opens up various opportunities
- Consistency and practice are the keys to success
- The future of ${topic} is very promising

### Call to Action

Let's start learning ${topic} more deeply and apply it in our lives. Share your experience in the comments and don't hesitate to ask if there's anything you'd like to discuss!

---

**Thank you for reading this article. Hope it's useful!** 🙏`;
	}

	private generateIndonesianBlogContent(title: string, topic: string, keywordText: string): string {
		return `# ${title}

## Pengantar

Halo pembaca! Hari ini kita akan membahas tentang ${topic}, sebuah topik yang sangat menarik dan relevan di era digital saat ini.

${keywordText ? `Dalam artikel ini, kita akan mengeksplorasi berbagai aspek terkait ${keywordText}.` : ''}

## Mengapa ${topic} Penting?

${topic} memiliki peran yang sangat penting dalam kehidupan kita sehari-hari. Mari kita lihat beberapa alasan mengapa topik ini layak untuk dipelajari dan dipahami.

### 1. Relevansi di Era Modern

Di era digital yang terus berkembang, ${topic} menjadi semakin relevan dan penting. Banyak aspek kehidupan kita yang dipengaruhi oleh perkembangan ${topic}.

### 2. Peluang dan Manfaat

Memahami ${topic} membuka berbagai peluang dan manfaat, baik secara personal maupun profesional.

## Aspek-Aspek Penting

### Aspek Teknis

Dari segi teknis, ${topic} melibatkan berbagai komponen dan konsep yang perlu dipahami:

- **Dasar-dasar**: Fondasi yang kuat
- **Implementasi**: Cara menerapkan dalam praktik
- **Optimasi**: Cara mendapatkan hasil terbaik

### Aspek Praktis

Secara praktis, ${topic} dapat diterapkan dalam berbagai konteks:

- **Penggunaan sehari-hari**: Aplikasi dalam kehidupan
- **Pengembangan profesional**: Peningkatan karir
- **Inovasi**: Menciptakan solusi baru

## Tips dan Saran

### Untuk Pemula

Jika Anda baru memulai dengan ${topic}, berikut beberapa tips yang bisa membantu:

1. **Mulai dari dasar**: Jangan terburu-buru
2. **Konsistensi**: Belajar secara teratur
3. **Praktik**: Terapkan apa yang dipelajari
4. **Komunitas**: Bergabung dengan komunitas yang relevan

### Untuk yang Sudah Berpengalaman

Bagi yang sudah familiar dengan ${topic}, pertimbangkan untuk:

- **Mendalami aspek lanjutan**
- **Berbagi pengetahuan**
- **Mentoring orang lain**
- **Eksplorasi inovasi terbaru**

## Tren dan Masa Depan

### Tren Saat Ini

${topic} terus berkembang dengan tren-tren baru yang menarik:

- **Teknologi terbaru**: Inovasi yang mengubah cara kerja
- **Metodologi baru**: Pendekatan yang lebih efektif
- **Tools dan platform**: Alat yang memudahkan implementasi

### Prediksi Masa Depan

Melihat ke depan, ${topic} akan terus berkembang dengan:

- **Integrasi yang lebih baik**
- **Automasi yang lebih canggih**
- **Aksesibilitas yang lebih luas**

## Kesimpulan

${topic} adalah topik yang sangat menarik dan memiliki potensi besar untuk masa depan. Dengan pemahaman yang baik dan implementasi yang tepat, kita dapat memanfaatkan ${topic} untuk mencapai berbagai tujuan.

### Key Takeaways

- ${topic} memiliki peran penting di era modern
- Pemahaman yang baik membuka berbagai peluang
- Konsistensi dan praktik adalah kunci sukses
- Masa depan ${topic} sangat menjanjikan

### Call to Action

Mari kita mulai mempelajari ${topic} lebih dalam dan menerapkannya dalam kehidupan kita. Bagikan pengalaman Anda di komentar dan jangan ragu untuk bertanya jika ada yang ingin didiskusikan!

---

**Terima kasih telah membaca artikel ini. Semoga bermanfaat!** 🙏`;
	}

	/**
	 * Generate article content
	 */
	private generateArticleContent(title: string, topic: string, keywords: string[], lang: string): string {
		return this.generateBlogContent(title, topic, keywords, lang);
	}

	/**
	 * Generate news content
	 */
	private generateNewsContent(title: string, topic: string, keywords: string[], _lang: string): string {
		const keywordText = keywords ? keywords.join(', ') : '';
		
		return `# ${title}

## Berita Terkini

${topic} menjadi topik yang sedang hangat dibicarakan dalam beberapa waktu terakhir. ${keywordText ? `Berbagai aspek terkait ${keywordText} menjadi sorotan utama.` : ''}

## Latar Belakang

Perkembangan ${topic} telah menunjukkan tren yang sangat positif dalam beberapa tahun terakhir. Hal ini tidak lepas dari berbagai faktor pendukung yang memungkinkan ${topic} berkembang pesat.

### Faktor Pendukung

1. **Teknologi yang semakin maju**
2. **Dukungan dari berbagai pihak**
3. **Kebutuhan yang terus meningkat**
4. **Inovasi yang berkelanjutan**

## Dampak dan Implikasi

### Dampak Positif

${topic} membawa berbagai dampak positif:

- **Efisiensi yang meningkat**
- **Kualitas yang lebih baik**
- **Aksesibilitas yang lebih luas**
- **Biaya yang lebih terjangkau**

### Tantangan yang Dihadapi

Meskipun memiliki banyak keuntungan, ${topic} juga menghadapi beberapa tantangan:

- **Kurva pembelajaran yang curam**
- **Investasi awal yang besar**
- **Resistensi terhadap perubahan**
- **Kebutuhan infrastruktur yang memadai**

## Respons dari Berbagai Pihak

### Pemerintah

Pemerintah telah menunjukkan dukungan yang positif terhadap perkembangan ${topic} dengan berbagai kebijakan dan program yang mendukung.

### Sektor Swasta

Perusahaan-perusahaan swasta juga turut berkontribusi dalam pengembangan ${topic} melalui investasi dan inovasi.

### Masyarakat

Masyarakat umum mulai menunjukkan antusiasme yang tinggi terhadap ${topic}, terlihat dari tingkat adopsi yang terus meningkat.

## Prospek ke Depan

### Prediksi Jangka Pendek

Dalam 1-2 tahun ke depan, ${topic} diperkirakan akan mengalami:

- **Pertumbuhan yang stabil**
- **Adopsi yang lebih luas**
- **Inovasi yang berkelanjutan**

### Visi Jangka Panjang

Dalam 5-10 tahun ke depan, ${topic} diharapkan dapat:

- **Menjadi standar industri**
- **Memberikan dampak yang lebih besar**
- **Menciptakan peluang baru**

## Kesimpulan

${topic} terus menunjukkan potensi yang besar untuk masa depan. Dengan dukungan dari berbagai pihak dan inovasi yang berkelanjutan, ${topic} diharapkan dapat memberikan kontribusi yang signifikan.

---

**Sumber**: Berbagai sumber terpercaya
**Tanggal**: ${new Date().toLocaleDateString('id-ID')}
**Kategori**: ${topic}`;
	}

	/**
	 * Generate review content
	 */
	private generateReviewContent(title: string, topic: string, keywords: string[], _lang: string): string {
		const keywordText = keywords ? keywords.join(', ') : '';
		
		return `# ${title}

## Review Lengkap

${topic} adalah salah satu topik yang patut untuk diulas secara mendalam. ${keywordText ? `Dalam review ini, kita akan membahas berbagai aspek terkait ${keywordText}.` : ''}

## Overview

${topic} telah menjadi bagian penting dalam berbagai aspek kehidupan. Mari kita lihat secara detail apa yang membuat ${topic} begitu menarik dan layak untuk dipelajari.

## Aspek Positif

### Kelebihan Utama

1. **Fleksibilitas**: ${topic} dapat diterapkan dalam berbagai konteks
2. **Skalabilitas**: Dapat dikembangkan sesuai kebutuhan
3. **Komunitas**: Dukungan komunitas yang kuat
4. **Dokumentasi**: Dokumentasi yang lengkap dan mudah dipahami

### Fitur Unggulan

- **User-friendly**: Mudah digunakan
- **Powerful**: Kuat dan efektif
- **Flexible**: Fleksibel dan dapat disesuaikan
- **Reliable**: Dapat diandalkan

## Aspek yang Perlu Diperhatikan

### Kekurangan

1. **Learning curve**: Memerlukan waktu untuk menguasai
2. **Resource intensive**: Membutuhkan sumber daya yang cukup
3. **Complexity**: Kompleksitas yang tinggi
4. **Dependencies**: Ketergantungan pada komponen lain

### Tantangan

- **Setup yang rumit**
- **Debugging yang sulit**
- **Performance issues**
- **Compatibility problems**

## Perbandingan dengan Alternatif

### vs [Alternatif 1]

**${topic}** memiliki keunggulan dalam:
- Aspek A
- Aspek B
- Aspek C

**Kekurangan**:
- Aspek D
- Aspek E

### vs [Alternatif 2]

**${topic}** lebih baik dalam:
- Fitur X
- Performa Y
- Kemudahan Z

**Kurang baik dalam**:
- Aspek P
- Aspek Q

## Use Cases dan Aplikasi

### Ideal untuk

- **Project A**: Sangat cocok untuk proyek jenis ini
- **Project B**: Memberikan hasil yang optimal
- **Project C**: Solusi yang tepat

### Tidak Cocok untuk

- **Project X**: Memerlukan pendekatan yang berbeda
- **Project Y**: Ada alternatif yang lebih baik
- **Project Z**: Terlalu kompleks untuk kebutuhan sederhana

## Rating dan Penilaian

### Overall Rating: 4.2/5

**Breakdown**:
- **Fitur**: 4.5/5
- **Kemudahan**: 3.8/5
- **Dokumentasi**: 4.0/5
- **Komunitas**: 4.5/5
- **Performansi**: 4.0/5

## Rekomendasi

### Untuk Pemula

Jika Anda baru memulai dengan ${topic}:

- **Mulai dengan tutorial dasar**
- **Bergabung dengan komunitas**
- **Praktik dengan proyek sederhana**
- **Jangan terburu-buru**

### Untuk Developer Berpengalaman

Bagi yang sudah berpengalaman:

- **Eksplorasi fitur lanjutan**
- **Kontribusi ke komunitas**
- **Buat proyek yang kompleks**
- **Bagikan pengalaman**

## Kesimpulan

${topic} adalah pilihan yang solid dengan banyak keunggulan. Meskipun memiliki beberapa kekurangan, kelebihannya jauh lebih banyak dan dapat memberikan nilai yang signifikan.

### Final Verdict

**Rekomendasi**: ✅ **Highly Recommended**

${topic} layak untuk dipelajari dan digunakan, terutama jika sesuai dengan kebutuhan dan tujuan Anda.

### Next Steps

1. **Coba dengan proyek kecil**
2. **Bergabung dengan komunitas**
3. **Eksplorasi dokumentasi**
4. **Bagikan pengalaman**

---

**Disclaimer**: Review ini berdasarkan pengalaman pribadi dan riset yang dilakukan. Hasil mungkin berbeda tergantung pada konteks dan kebutuhan spesifik.`;
	}

	/**
	 * Generate default content
	 */
	private generateDefaultContent(title: string, topic: string, keywords: string[], lang: string): string {
		return this.generateBlogContent(title, topic, keywords, lang);
	}

	/**
	 * Get category from topic
	 */
	private getCategoryFromTopic(topic: string): string {
		const topicLower = topic.toLowerCase();
		
		if (topicLower.includes('react') || topicLower.includes('javascript') || topicLower.includes('programming')) {
			return 'Programming';
		}
		if (topicLower.includes('business') || topicLower.includes('bisnis') || topicLower.includes('marketing')) {
			return 'Business';
		}
		if (topicLower.includes('tutorial') || topicLower.includes('panduan') || topicLower.includes('belajar')) {
			return 'Tutorial';
		}
		if (topicLower.includes('news') || topicLower.includes('berita') || topicLower.includes('update')) {
			return 'News';
		}
		
		return 'General';
	}
}

// Export singleton instance
export const aiService = AIService.getInstance();
export default aiService;
