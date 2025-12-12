import { getTextModel, getTextModelForContent, validateAIConfig, AI_CONFIG } from '@/libs/config/ai';
import logger from '@/libs/core/logger';
import { QuotaExceededException, ServiceUnavailableException } from '@/libs/core/exceptions';

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
	metaTitle?: string; // SEO meta title (optional, default: same as title)
	metaKeywords?: string; // SEO meta keywords (optional)
	suggestedTags: string[];
	suggestedCategory: string;
	seoScore: number;
	estimatedReadTime: number;
	// Provider information
	provider?: 'gemini' | 'zenmux';
	apiKey?: string; // Masked API key (only show last 4 characters)
	model?: string;
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

export interface IContentSuggestionsRequest {
	topic: string;
	contentType: 'blog' | 'article' | 'tutorial' | 'news' | 'review';
	language: 'id' | 'en';
	count?: number; // Number of suggestions to generate
}

export interface IContentSuggestionsResponse {
	suggestions: {
		title: string;
		excerpt: string;
		estimatedReadTime: number;
		seoScore: number;
		suggestedTags: string[];
		suggestedCategory: string;
	}[];
	totalSuggestions: number;
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
		 * Mask API key - only show last 4 characters
		 */
	private maskApiKey(apiKey: string): string {
		if (!apiKey || apiKey.length <= 4) {
			return '****';
		}
		return '****' + apiKey.slice(-4);
	}

	/**
	 * Validate AI configuration (lazy validation)
	 */
	private validateConfig(): void {
		validateAIConfig();
	}

	/**
	 * Generate content using AI
	 * Primary: Gemini API
	 * Fallback: ZenMux API (if Gemini fails)
	 */
	async generateContent(request: IContentGenerationRequest): Promise<IContentGenerationResponse> {
		try {
			this.validateConfig();
			// Use model with higher token limit for content generation
			const model = getTextModelForContent();
			
			// Translate topic and keywords if generating English content
			let finalTopic = request.topic;
			let finalKeywords = request.keywords || [];
			
			if (request.language === 'en') {
				const translation = this.translateToEnglish(request.topic, request.keywords || []);
				finalTopic = translation.translatedTopic;
				finalKeywords = translation.translatedKeywords;
			}
			
			const prompt = this.buildContentPrompt(request);
			
			logger.info('Generating content with Gemini AI...', { 
				originalTopic: request.topic,
				translatedTopic: finalTopic,
				originalKeywords: request.keywords,
				translatedKeywords: finalKeywords,
				contentType: request.contentType,
				language: request.language,
				maxTokens: 16384 // Log the token limit being used
			});
			
			const result = await model.generateContent(prompt);
			const response = await result.response;
			const text = response.text();
			const finishReason = response.candidates?.[0]?.finishReason;
			
			logger.info('Gemini AI content generated successfully', { 
				contentLength: text.length,
				finishReason: finishReason || 'unknown'
			});
			
			// Check if response was truncated due to token limit
			if (finishReason === 'MAX_TOKENS') {
				logger.warn('AI response was truncated due to token limit. Consider increasing maxOutputTokens.');
				throw new Error('AI response was truncated. The content is too long. Please try with shorter content length or increase token limit.');
			}
			
			// Create modified request with translated topic/keywords for response
			const modifiedRequest = {
				...request,
				topic: finalTopic,
				keywords: finalKeywords
			};
			
			// Add provider info for Gemini
			const providerInfo = {
				provider: 'gemini' as const,
				apiKey: AI_CONFIG.GEMINI_API_KEY,
				model: AI_CONFIG.GEMINI_MODEL
			};
			
			return this.parseContentResponse(text, modifiedRequest, providerInfo);
		} catch (error) {
			logger.error('Gemini AI Content Generation failed:', error);
			
			// Check if it's a network/API error that should NOT fallback (will fail on ZenMux too)
			if (error instanceof Error) {
				if (error.message.includes('fetch failed') || error.message.includes('network')) {
					throw new ServiceUnavailableException('AI service is currently unavailable. Please check your internet connection and API configuration.');
				}
				if (error.message.includes('API key') || error.message.includes('authentication')) {
					throw new ServiceUnavailableException('AI API key is invalid or missing. Please check your GEMINI_API_KEY configuration.');
				}
			}
			
			// Try fallback to ZenMux if Gemini fails
			// This includes: quota/rate limit, 503/overloaded, and other errors
			logger.warn('Gemini API failed, attempting fallback to ZenMux...', {
				error: error instanceof Error ? error.message : 'Unknown error',
				errorType: error instanceof Error && (
					error.message.includes('quota') || error.message.includes('rate limit') || error.message.includes('429') ? 'quota' :
						error.message.includes('503') || error.message.includes('overloaded') ? 'overloaded' :
							'other'
				)
			});
			
			try {
				return await this.generateContentWithZenmux(request);
			} catch (zenmuxError) {
				logger.error('ZenMux fallback also failed:', zenmuxError);
				
				// If ZenMux also fails, provide helpful error message based on original error
				if (error instanceof Error) {
					if (error.message.includes('quota') || error.message.includes('rate limit') || error.message.includes('429') || error.message.includes('Too Many Requests')) {
						// Extract retry delay from error message
						let retryDelaySeconds = 15; // default
						const retryDelayMatch = error.message.match(/retry in ([\d.]+)s/i) || error.message.match(/retryDelay["']?\s*:\s*["']?(\d+)/i);
						if (retryDelayMatch) {
							retryDelaySeconds = parseFloat(retryDelayMatch[1]);
						}
						
						// Format waktu retry yang user-friendly
						const formatRetryTime = (seconds: number): string => {
							if (seconds < 60) {
								return `${Math.ceil(seconds)} detik`;
							} else if (seconds < 3600) {
								const minutes = Math.ceil(seconds / 60);
								return `${minutes} menit`;
							} else {
								const hours = Math.ceil(seconds / 3600);
								return `${hours} jam`;
							}
						};
						
						const retryTime = formatRetryTime(retryDelaySeconds);
						
						if (zenmuxError instanceof Error && zenmuxError.message.includes('credit')) {
							throw new ServiceUnavailableException(`Gemini quota habis dan ZenMux memerlukan credit. Silakan: 1) Top up credit di ZenMux (https://zenmux.ai), atau 2) Tunggu ${retryTime} untuk Gemini API.`);
						}
						throw new QuotaExceededException(`Quota/rate limit tercapai di Gemini. Limit free tier Gemini API: 20 requests per hari. Fallback ke ZenMux juga gagal. Silakan coba lagi dalam ${retryTime} (atau tunggu hingga quota reset). Untuk quota lebih besar, pertimbangkan upgrade ke paid plan.`);
					}
					if (error.message.includes('503') || error.message.includes('Service Unavailable') || error.message.includes('overloaded')) {
						if (zenmuxError instanceof Error && zenmuxError.message.includes('credit')) {
							throw new ServiceUnavailableException('Gemini sedang overloaded dan ZenMux memerlukan credit. Silakan: 1) Top up credit di ZenMux (https://zenmux.ai), atau 2) Tunggu beberapa saat untuk Gemini API kembali normal.');
						}
						throw new ServiceUnavailableException(`Gemini sedang overloaded dan fallback ke ZenMux juga gagal. Silakan coba lagi dalam beberapa saat. Jika masalah berlanjut, coba lagi nanti. ZenMux error: ${zenmuxError instanceof Error ? zenmuxError.message : 'Unknown error'}`);
					}
				}
				
				// Generic fallback error
				if (zenmuxError instanceof Error && zenmuxError.message.includes('credit')) {
					throw new ServiceUnavailableException(`Gemini API gagal dan fallback ke ZenMux juga gagal karena memerlukan credit. Silakan: 1) Top up credit di ZenMux (https://zenmux.ai), atau 2) Tunggu hingga Gemini API kembali normal. Error Gemini: ${error instanceof Error ? error.message : 'Unknown error'}`);
				}
				throw new ServiceUnavailableException(`Failed to generate content with both Gemini and ZenMux. Gemini error: ${error instanceof Error ? error.message : 'Unknown error'}. ZenMux error: ${zenmuxError instanceof Error ? zenmuxError.message : 'Unknown error'}`);
			}
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
			
			logger.info('Optimizing content for SEO...', { 
				title: request.title,
				contentLength: request.content.length,
				targetKeywords: request.targetKeywords
			});
			
			const result = await model.generateContent(prompt);
			const response = await result.response;
			const text = response.text();
			
			logger.info('SEO optimization completed successfully', { 
				responseLength: text.length 
			});
			
			return this.parseSEOResponse(text, request);
		} catch (error) {
			logger.error('AI SEO Optimization failed:', error);
			
			// Check if it's a network/API error
			if (error instanceof Error) {
				if (error.message.includes('fetch failed') || error.message.includes('network')) {
					throw new Error('AI service is currently unavailable. Please check your internet connection and API configuration.');
				}
				if (error.message.includes('API key') || error.message.includes('authentication')) {
					throw new Error('AI API key is invalid or missing. Please check your GEMINI_API_KEY configuration.');
				}
				if (error.message.includes('quota') || error.message.includes('rate limit')) {
					throw new Error('AI service quota exceeded. Please try again later.');
				}
			}
			
			// Fallback to basic SEO optimization
			logger.warn('Using fallback SEO optimization due to AI service error');
			return this.generateFallbackSEOResponse(request);
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
		
		// 2. Try Google Cloud Vertex AI (if API key exists)
		if (process.env.GOOGLE_CLOUD_PROJECT_ID && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
			try {
				logger.info('Trying Google Cloud Vertex AI...');
				const result = await this.generateImageWithVertexAI(request);
				logger.info('Google Cloud Vertex AI successful, stopping here to save credits');
				return result;
			} catch (vertexError: any) {
				logger.warn('Google Cloud Vertex AI failed:', vertexError.message);
				// Check if it's a quota limit error
				if (vertexError.message?.includes('quota') || 
					vertexError.message?.includes('limit') || 
					vertexError.message?.includes('billing') ||
					vertexError.message?.includes('403')) {
					logger.warn('Google Cloud Vertex AI quota limit reached, trying next service...');
				}
			}
		}

		// 3. Try OpenAI DALL-E (if API key exists)
		if (process.env.OPENAI_API_KEY) {
			try {
				logger.info('Trying OpenAI DALL-E API...');
				const result = await this.generateImageWithDALLE(request);
				logger.info('OpenAI DALL-E API successful, stopping here to save credits');
				return result;
			} catch (openaiError: any) {
				logger.warn('OpenAI DALL-E API failed:', openaiError.message);
				// Check if it's a billing/credit limit error
				if (openaiError.message?.includes('credit') || 
					openaiError.message?.includes('limit') || 
					openaiError.message?.includes('billing') ||
					openaiError.message?.includes('402') ||
					openaiError.message?.includes('billing_hard_limit_reached')) {
					logger.warn('OpenAI billing/credit limit reached, using placeholder...');
				}
			}
		}
		
		// 4. Fallback to placeholder
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
	 * Generate fallback SEO optimization when AI service is unavailable
	 */
	private generateFallbackSEOResponse(request: ISEOOptimizationRequest): ISEOOptimizationResponse {
		const { title, content, targetKeywords } = request;
		
		// Basic SEO optimization without AI
		const optimizedTitle = this.optimizeTitleForSEO(title, targetKeywords || []);
		const metaDescription = this.generateMetaDescription(content);
		const suggestedKeywords = this.extractKeywordsFromContent(content, targetKeywords || []);
		const seoScore = this.calculateSEOScore(content, optimizedTitle, metaDescription, suggestedKeywords);
		const improvements = this.generateSEOImprovements(content, optimizedTitle, metaDescription);
		
		return {
			optimizedTitle,
			metaDescription,
			suggestedKeywords,
			seoScore,
			improvements
		};
	}

	/**
	 * Optimize title for SEO
	 */
	private optimizeTitleForSEO(title: string, targetKeywords: string[]): string {
		// Basic title optimization
		let optimized = title;
		
		// Add target keywords if not already present
		if (targetKeywords.length > 0) {
			const primaryKeyword = targetKeywords[0];
			if (!optimized.toLowerCase().includes(primaryKeyword.toLowerCase())) {
				optimized = `${primaryKeyword} - ${optimized}`;
			}
		}
		
		// Ensure title is not too long (60 characters max)
		if (optimized.length > 60) {
			optimized = optimized.substring(0, 57) + '...';
		}
		
		return optimized;
	}

	/**
	 * Extract keywords from content
	 */
	private extractKeywordsFromContent(content: string, targetKeywords: string[]): string[] {
		// Combine target keywords with extracted keywords
		const extractedKeywords = this.extractTags(content);
		const allKeywords = [...new Set([...targetKeywords, ...extractedKeywords])];
		
		// Return top 10 keywords
		return allKeywords.slice(0, 10);
	}

	/**
	 * Calculate basic SEO score
	 */
	private calculateSEOScore(content: string, title: string, metaDescription: string, keywords: string[]): number {
		let score = 0;
		
		// Title length check (30-60 characters)
		if (title.length >= 30 && title.length <= 60) score += 20;
		else if (title.length > 0) score += 10;
		
		// Meta description length check (120-160 characters)
		if (metaDescription.length >= 120 && metaDescription.length <= 160) score += 20;
		else if (metaDescription.length > 0) score += 10;
		
		// Content length check (minimum 300 words)
		const wordCount = content.split(/\s+/).length;
		if (wordCount >= 300) score += 20;
		else if (wordCount >= 150) score += 10;
		
		// Keywords presence check
		if (keywords.length > 0) score += 20;
		
		// Headings check
		const headingCount = (content.match(/<h[1-6]>/gi) || []).length;
		if (headingCount >= 3) score += 10;
		else if (headingCount >= 1) score += 5;
		
		// Images check (if any)
		const imageCount = (content.match(/<img/gi) || []).length;
		if (imageCount > 0) score += 10;
		
		return Math.min(score, 100);
	}

	/**
	 * Generate SEO improvements suggestions
	 */
	private generateSEOImprovements(content: string, title: string, metaDescription: string): string[] {
		const improvements: string[] = [];
		
		// Title improvements
		if (title.length < 30) {
			improvements.push('Title is too short. Consider adding more descriptive words (30-60 characters recommended).');
		} else if (title.length > 60) {
			improvements.push('Title is too long. Consider shortening it to under 60 characters.');
		}
		
		// Meta description improvements
		if (metaDescription.length < 120) {
			improvements.push('Meta description is too short. Aim for 120-160 characters.');
		} else if (metaDescription.length > 160) {
			improvements.push('Meta description is too long. Keep it under 160 characters.');
		}
		
		// Content improvements
		const wordCount = content.split(/\s+/).length;
		if (wordCount < 300) {
			improvements.push('Content is too short. Consider adding more detailed information (minimum 300 words recommended).');
		}
		
		// Headings improvements
		const headingCount = (content.match(/<h[1-6]>/gi) || []).length;
		if (headingCount < 3) {
			improvements.push('Add more headings to improve content structure and readability.');
		}
		
		// Images improvements
		const imageCount = (content.match(/<img/gi) || []).length;
		if (imageCount === 0) {
			improvements.push('Consider adding relevant images to improve user engagement.');
		}
		
		return improvements;
	}


	/**
	 * Translate Indonesian topic/keywords to English for better AI understanding
	 */
	private translateToEnglish(topic: string, keywords: string[]): { translatedTopic: string, translatedKeywords: string[] } {
		// Common Indonesian to English translations for tech topics
		const translations: { [key: string]: string } = {
			'pemrograman': 'programming',
			'pengembangan': 'development',
			'web development': 'web development',
			'belajar': 'learning',
			'coding': 'coding',
			'javascript': 'javascript',
			'python': 'python',
			'react': 'react',
			'nodejs': 'nodejs',
			'database': 'database',
			'api': 'api',
			'frontend': 'frontend',
			'backend': 'backend',
			'fullstack': 'fullstack',
			'mobile': 'mobile',
			'android': 'android',
			'ios': 'ios',
			'ui': 'ui',
			'ux': 'ux',
			'design': 'design',
			'framework': 'framework',
			'library': 'library',
			'tutorial': 'tutorial',
			'panduan': 'guide',
			'cara': 'how to',
			'tips': 'tips',
			'trik': 'tricks',
			'contoh': 'examples',
			'praktik': 'practice',
			'proyek': 'project',
			'aplikasi': 'application',
			'website': 'website',
			'blog': 'blog',
			'seo': 'seo',
			'optimasi': 'optimization',
			'performansi': 'performance',
			'keamanan': 'security',
			'debugging': 'debugging',
			'testing': 'testing',
			'deployment': 'deployment',
			'devops': 'devops',
			'cloud': 'cloud',
			'aws': 'aws',
			'azure': 'azure',
			'google cloud': 'google cloud',
			'docker': 'docker',
			'kubernetes': 'kubernetes',
			'git': 'git',
			'github': 'github',
			'gitlab': 'gitlab',
			'ci/cd': 'ci/cd',
			'agile': 'agile',
			'scrum': 'scrum',
			'kanban': 'kanban',
			// Additional translations for general topics
			'perlu': 'need to',
			'dipelajari': 'learn',
			'sebelum': 'before',
			'menikah': 'marriage',
			'pranikah': 'pre-marriage',
			'pelatihan': 'training',
			'apa': 'what',
			'yang': 'that',
			'untuk': 'for',
			'dengan': 'with',
			'dalam': 'in',
			'pada': 'at',
			'oleh': 'by',
			'dari': 'from',
			'ke': 'to',
			'di': 'in',
			'sebagai': 'as',
			'atau': 'or',
			'dan': 'and',
			'tetapi': 'but',
			'namun': 'however',
			'jika': 'if',
			'ketika': 'when',
			'karena': 'because',
			'setelah': 'after',
			'selama': 'during',
			'sejak': 'since',
			'sampai': 'until',
			'hingga': 'until',
			'antara': 'between',
			'antara lain': 'among others',
			'terutama': 'especially',
			'khususnya': 'particularly',
			'umumnya': 'generally',
			'biasanya': 'usually',
			'sering': 'often',
			'jarang': 'rarely',
			'tidak': 'not',
			'bukan': 'not',
			'belum': 'not yet',
			'sudah': 'already',
			'akan': 'will',
			'telah': 'has/have',
			'pernah': 'ever',
			'pasti': 'surely',
			'mungkin': 'maybe',
			'bisa': 'can',
			'dapat': 'can',
			'mampu': 'able to',
			'harus': 'must',
			'ingin': 'want to',
			'mau': 'want to',
			'suka': 'like',
			'senang': 'happy',
			'bahagia': 'happy',
			'baik': 'good',
			'bagus': 'good',
			'hebat': 'great',
			'luar biasa': 'extraordinary',
			'penting': 'important',
			'berguna': 'useful',
			'bermanfaat': 'beneficial',
			'efektif': 'effective',
			'efisien': 'efficient',
			'berhasil': 'successful',
			'gagal': 'failed',
			'kegagalan': 'failure',
			'kesuksesan': 'success',
			'pengalaman': 'experience',
			'pengetahuan': 'knowledge',
			'keterampilan': 'skills',
			'kemampuan': 'ability',
			'keahlian': 'expertise',
			'profesional': 'professional',
			'personal': 'personal',
			'pribadi': 'personal',
			'keluarga': 'family',
			'rumah tangga': 'household',
			'karir': 'career',
			'pekerjaan': 'work',
			'bisnis': 'business',
			'usaha': 'business',
			'perusahaan': 'company',
			'organisasi': 'organization',
			'komunitas': 'community',
			'masyarakat': 'society',
			'negara': 'country',
			'dunia': 'world',
			'global': 'global',
			'lokal': 'local',
			'nasional': 'national',
			'internasional': 'international'
		};

		// Translate topic - try to translate common phrases first
		let translatedTopic = topic.toLowerCase();
		
		// Common phrase translations
		const phraseTranslations: { [key: string]: string } = {
			'apa yang perlu dipelajari sebelum menikah': 'what to learn before marriage',
			'cara belajar': 'how to learn',
			'panduan lengkap': 'complete guide',
			'tips dan trik': 'tips and tricks',
			'cara membuat': 'how to make',
			'cara menggunakan': 'how to use',
			'cara mengatasi': 'how to solve',
			'cara mengoptimalkan': 'how to optimize',
			'cara meningkatkan': 'how to improve',
			'cara mengembangkan': 'how to develop',
			'cara mengelola': 'how to manage',
			'cara mengatur': 'how to organize',
			'cara memilih': 'how to choose',
			'cara menentukan': 'how to determine',
			'cara mengukur': 'how to measure',
			'cara mengevaluasi': 'how to evaluate',
			'cara menganalisis': 'how to analyze',
			'cara menginterpretasikan': 'how to interpret',
			'cara mengimplementasikan': 'how to implement',
			'cara mengaplikasikan': 'how to apply',
			'cara menerapkan': 'how to apply',
			'cara mengintegrasikan': 'how to integrate',
			'cara mengkustomisasi': 'how to customize',
			'cara mengkonfigurasi': 'how to configure',
			'cara menginstal': 'how to install',
			'cara mengupgrade': 'how to upgrade',
			'cara mengupdate': 'how to update'
		};
		
		// Try phrase translations first
		Object.keys(phraseTranslations).forEach(indonesian => {
			if (translatedTopic.includes(indonesian)) {
				translatedTopic = translatedTopic.replace(indonesian, phraseTranslations[indonesian]);
			}
		});
		
		// Then try word-by-word translations
		Object.keys(translations).forEach(indonesian => {
			const english = translations[indonesian];
			translatedTopic = translatedTopic.replace(new RegExp(`\\b${indonesian}\\b`, 'gi'), english);
		});

		// Translate keywords
		const translatedKeywords = keywords.map(keyword => {
			let translated = keyword.toLowerCase();
			
			// Try phrase translations first
			Object.keys(phraseTranslations).forEach(indonesian => {
				if (translated.includes(indonesian)) {
					translated = translated.replace(indonesian, phraseTranslations[indonesian]);
				}
			});
			
			// Then try word-by-word translations
			Object.keys(translations).forEach(indonesian => {
				const english = translations[indonesian];
				translated = translated.replace(new RegExp(`\\b${indonesian}\\b`, 'gi'), english);
			});
			
			return translated;
		});

		return {
			translatedTopic: translatedTopic,
			translatedKeywords: translatedKeywords
		};
	}

	/**
	 * Build content generation prompt with enhanced AI instructions
	 */
	private buildContentPrompt(request: IContentGenerationRequest): string {
		const { topic, keywords, contentType, tone, length, language } = request;
		
		const lang = language === 'id' ? 'Indonesian' : 'English';
		const lengthWords = length === 'short' ? '300-500' : length === 'medium' ? '800-1200' : '1500-2500';
		
		// Build content type specific instructions
		const contentTypeInstructions: Record<string, string> = {
			blog: 'Tulis artikel blog yang engaging, informatif, dan mudah dibaca. Gunakan gaya penulisan yang natural dan conversational.',
			article: 'Tulis artikel yang lebih formal dan informatif dengan struktur yang jelas. Fokus pada informasi yang akurat dan detail.',
			tutorial: 'Tulis tutorial step-by-step yang jelas dan mudah diikuti. Sertakan contoh praktis dan penjelasan yang detail.',
			news: 'Tulis berita dengan format jurnalistik yang objektif. Sertakan fakta, konteks, dan informasi terkini.',
			review: 'Tulis review yang komprehensif dengan analisis mendalam. Sertakan pro-kontra, perbandingan, dan rekomendasi.'
		};

		const contentTypeInstruction = contentTypeInstructions[contentType] || contentTypeInstructions['blog'];

		return `Kamu adalah penulis konten profesional. Buat ${contentType} yang lengkap dan menarik tentang topik: "${topic}"

${contentTypeInstruction}

Parameter:
- Bahasa: ${lang}
- Gaya penulisan: ${tone}
- Panjang: ${lengthWords} kata
${keywords && keywords.length > 0 ? `- Kata kunci yang harus disertakan: ${keywords.join(', ')}` : ''}

Instruksi:
- Tulis konten yang natural, kreatif, dan informatif
- Gunakan HTML tags untuk formatting (<h2>, <h3>, <p>, <ul>, <ol>, <table>)
- Pastikan konten LENGKAP mencapai minimal ${lengthWords} kata
- Berikan informasi spesifik, relevan, dan bermanfaat
- Biarkan kreativitasmu mengalir - jangan gunakan template generic

Kembalikan HANYA JSON murni yang LENGKAP (tanpa markdown code block, tanpa teks lain, PASTIKAN JSON LENGKAP dan tidak terpotong):
{
  "title": "Judul yang menarik dan relevan dengan topik",
  "content": "Konten artikel lengkap dengan HTML tags. Pastikan konten mencapai minimal ${lengthWords} kata dan tidak terpotong.",
  "excerpt": "Ringkasan singkat maksimal 500 karakter (sekitar 80-100 kata) yang menarik dan informatif",
  "metaDescription": "Deskripsi SEO 150-160 karakter",
  "metaTitle": "Judul SEO yang dioptimalkan untuk search engine (50-60 karakter, bisa berbeda dari title untuk SEO yang lebih baik)",
  "metaKeywords": "Kata kunci SEO, dipisahkan dengan koma, relevan dengan konten",
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "suggestedCategory": "kategori yang relevan",
  "seoScore": [HITUNG dan berikan angka SEO score 0-100 berdasarkan analisis: panjang konten, penggunaan keywords, struktur HTML (headings), meta description, relevansi konten, dll. Berikan nilai yang akurat dan realistis],
  "estimatedReadTime": [HITUNG dan berikan angka estimated read time dalam menit berdasarkan panjang konten (asumsi 200 kata per menit)]
}

PENTING:
- seoScore dan estimatedReadTime harus berupa ANGKA, bukan string atau teks
- JSON HARUS LENGKAP dengan semua field dan closing brace }
- Jangan potong JSON di tengah-tengah - pastikan response lengkap sampai akhir
- Content field HARUS berisi konten LENGKAP minimal ${lengthWords} kata, jangan terpotong
- Pastikan semua field JSON terisi lengkap sebelum menutup dengan }
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
	private parseContentResponse(text: string, request: IContentGenerationRequest, providerInfo?: { provider: 'gemini' | 'zenmux'; apiKey?: string; model?: string }): IContentGenerationResponse {
		try {
			// Clean the text first - remove markdown code blocks if present
			let cleanText = text.trim();
			
			logger.info('Parsing AI response', {
				textLength: text.length,
				hasCodeBlocks: cleanText.includes('```'),
				firstChars: text.substring(0, 200) // Log first 200 chars to see what AI returned
			});
			
			// Remove markdown code blocks (```json ... ``` or ``` ... ```)
			if (cleanText.includes('```')) {
				// Try to extract JSON from markdown code block - use non-greedy but match complete JSON
				const codeBlockMatch = cleanText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
				if (codeBlockMatch && codeBlockMatch[1]) {
					cleanText = codeBlockMatch[1].trim();
					logger.info('Extracted JSON from markdown code block');
				} else {
					// Remove code block markers but keep content
					cleanText = cleanText.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim();
					logger.info('Removed code block markers');
				}
			}
			
			// Try to find complete JSON object - need to match nested braces properly
			let jsonText = '';
			let braceCount = 0;
			let startIndex = -1;
			
			for (let i = 0; i < cleanText.length; i++) {
				if (cleanText[i] === '{') {
					if (startIndex === -1) startIndex = i;
					braceCount++;
				} else if (cleanText[i] === '}') {
					braceCount--;
					if (braceCount === 0 && startIndex !== -1) {
						jsonText = cleanText.substring(startIndex, i + 1);
						break;
					}
				}
			}
			
			logger.info('JSON extraction result', {
				foundJson: !!jsonText,
				jsonLength: jsonText.length,
				braceCount
			});
			
			// If brace matching failed but we have opening brace, try to fix incomplete JSON
			if (!jsonText && braceCount > 0 && startIndex !== -1) {
				// JSON might be incomplete - try to extract what we have and add closing brace
				const partialJson = cleanText.substring(startIndex);
				logger.warn('Incomplete JSON detected, attempting to fix', {
					partialJson: partialJson.substring(0, 100),
					braceCount
				});
				
				// Try to add missing closing braces
				let fixedJson = partialJson;
				for (let i = 0; i < braceCount; i++) {
					fixedJson += '}';
				}
				
				// Try to parse the fixed JSON
				try {
					const testParsed = JSON.parse(fixedJson);
					if (testParsed.content) {
						jsonText = fixedJson;
						logger.info('Successfully fixed incomplete JSON');
					}
				} catch (e) {
					logger.warn('Failed to fix incomplete JSON');
				}
			}
			
			// If brace matching failed, try regex as fallback
			if (!jsonText) {
				const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
				if (jsonMatch) {
					jsonText = jsonMatch[0];
					logger.info('Used regex fallback to extract JSON');
				}
			}
			
			// If still no JSON found, try original text
			if (!jsonText) {
				const jsonMatch = text.match(/\{[\s\S]*\}/);
				if (jsonMatch) {
					jsonText = jsonMatch[0];
					logger.info('Used original text to extract JSON');
				}
			}
			
			if (jsonText) {
				try {
					// Parse the JSON - handle escaped strings properly
					const parsed = JSON.parse(jsonText);
					
					// Use ALL fields from AI response - especially title must come from AI
					if (parsed.content && typeof parsed.content === 'string' && parsed.content.length > 50) {
						// Ensure excerpt doesn't exceed 500 characters
						let excerpt = parsed.excerpt || this.generateExcerpt(parsed.content);
						if (excerpt.length > 500) {
							excerpt = excerpt.substring(0, 497) + '...';
						}
				
						return {
							title: parsed.title || request.topic || 'Generated Title', // Title from AI, not from request
							content: parsed.content, // Full content from AI
							excerpt: excerpt,
							metaDescription: parsed.metaDescription || this.generateMetaDescription(parsed.content),
							metaTitle: parsed.metaTitle || parsed.title || request.topic, // Meta title (default: same as title)
							metaKeywords: parsed.metaKeywords || undefined, // Meta keywords (optional)
							suggestedTags: parsed.suggestedTags || this.extractTags(parsed.content),
							suggestedCategory: parsed.suggestedCategory || this.getCategoryFromTopic(request.topic || parsed.title),
							seoScore: parsed.seoScore !== undefined ? parsed.seoScore : 75, // Use AI's SEO score
							estimatedReadTime: parsed.estimatedReadTime !== undefined ? parsed.estimatedReadTime : this.calculateReadTime(parsed.content),
							provider: providerInfo?.provider,
							apiKey: providerInfo?.apiKey ? this.maskApiKey(providerInfo.apiKey) : undefined,
							model: providerInfo?.model
						};
					} else {
						logger.warn('Parsed JSON but content is missing or too short');
					}
				} catch (parseError: any) {
					logger.warn('Failed to parse JSON, trying alternative parsing:', parseError.message);
					
					// Better extraction method for long JSON strings
					const extractJsonField = (fieldName: string, jsonStr: string): string | null => {
						// Find the field position
						const fieldPattern = new RegExp(`"${fieldName}"\\s*:\\s*"`, 's');
						const fieldMatch = jsonStr.match(fieldPattern);
						
						if (!fieldMatch || !fieldMatch.index) {
							return null;
						}
						
						// Start from after the field name and opening quote
						let startPos = fieldMatch.index + fieldMatch[0].length;
						let result = '';
						let i = startPos;
						let escapeNext = false;
						
						// Parse character by character to handle escaped quotes properly
						while (i < jsonStr.length) {
							const char = jsonStr[i];
							
							if (escapeNext) {
								result += char;
								escapeNext = false;
								i++;
								continue;
							}
							
							if (char === '\\') {
								escapeNext = true;
								result += char;
								i++;
								continue;
							}
							
							if (char === '"') {
								// Found closing quote, check if it's the end of the field value
								// Look ahead to see if there's a comma or closing brace
								let j = i + 1;
								while (j < jsonStr.length && (jsonStr[j] === ' ' || jsonStr[j] === '\n' || jsonStr[j] === '\r' || jsonStr[j] === '\t')) {
									j++;
								}
								
								if (j >= jsonStr.length || jsonStr[j] === ',' || jsonStr[j] === '}') {
									// This is the end of the field value
									break;
								}
							}
							
							result += char;
							i++;
						}
						
						if (result) {
							// Unescape the string
							return result
								.replace(/\\"/g, '"')
								.replace(/\\n/g, '\n')
								.replace(/\\r/g, '\r')
								.replace(/\\t/g, '\t')
								.replace(/\\\\/g, '\\');
						}
						
						return null;
					};
					
					const extractedContent = extractJsonField('content', jsonText);
					const extractedTitle = extractJsonField('title', jsonText);
					const extractedExcerpt = extractJsonField('excerpt', jsonText);
					const extractedMetaDesc = extractJsonField('metaDescription', jsonText);
					const extractedMetaTitle = extractJsonField('metaTitle', jsonText);
					const extractedMetaKeywords = extractJsonField('metaKeywords', jsonText);
					
					// Try to extract seoScore (number field, not string)
					let extractedSeoScore: number | undefined;
					const seoScoreMatch = jsonText.match(/"seoScore"\s*:\s*(\d+)/);
					if (seoScoreMatch && seoScoreMatch[1]) {
						extractedSeoScore = parseInt(seoScoreMatch[1], 10);
					}
					
					// Try to extract estimatedReadTime (number field, not string)
					let extractedReadTime: number | undefined;
					const readTimeMatch = jsonText.match(/"estimatedReadTime"\s*:\s*(\d+)/);
					if (readTimeMatch && readTimeMatch[1]) {
						extractedReadTime = parseInt(readTimeMatch[1], 10);
					}
					
					if (extractedContent && extractedContent.length > 50) {
						// Try to extract tags array
						const tagsMatch = jsonText.match(/"suggestedTags"\s*:\s*\[(.*?)\]/s);
						let extractedTags: string[] = [];
						if (tagsMatch && tagsMatch[1]) {
							const tagMatches = tagsMatch[1].match(/"([^"]+)"/g);
							if (tagMatches) {
								extractedTags = tagMatches.map(tag => tag.replace(/"/g, ''));
							}
						}
						
						logger.info('Successfully extracted content from JSON', {
							contentLength: extractedContent.length,
							title: extractedTitle,
							seoScore: extractedSeoScore
						});

						// Ensure excerpt doesn't exceed 500 characters
						let excerpt = extractedExcerpt || this.generateExcerpt(extractedContent);
						if (excerpt.length > 500) {
							excerpt = excerpt.substring(0, 497) + '...';
						}
				
						return {
							title: extractedTitle || request.topic || 'Generated Title',
							content: extractedContent,
							excerpt: excerpt,
							metaDescription: extractedMetaDesc || this.generateMetaDescription(extractedContent),
							metaTitle: extractedMetaTitle || extractedTitle || request.topic, // Meta title (default: same as title)
							metaKeywords: extractedMetaKeywords || undefined, // Meta keywords (optional)
							suggestedTags: extractedTags.length > 0 ? extractedTags : this.extractTags(extractedContent),
							suggestedCategory: this.getCategoryFromTopic(request.topic || extractedTitle || ''),
							seoScore: extractedSeoScore !== undefined ? extractedSeoScore : 75, // Use AI's SEO score
							estimatedReadTime: extractedReadTime !== undefined ? extractedReadTime : this.calculateReadTime(extractedContent),
							provider: providerInfo?.provider,
							apiKey: providerInfo?.apiKey ? this.maskApiKey(providerInfo.apiKey) : undefined,
							model: providerInfo?.model
						};
					} else {
						logger.warn('Failed to extract content from JSON, content too short or missing', {
							contentLength: extractedContent?.length || 0
						});
					}
				}
			}
			
			// If JSON parsing failed completely, check if raw text is usable
			// But don't use raw JSON string as content
			const isJsonString = cleanText.trim().startsWith('{') && cleanText.includes('"content"');
			const isGenericContent = this.isGenericContent(cleanText, request.topic || '');
			
			let content: string;
			let finalTitle: string;
			
			// If JSON parsing failed completely, log the actual response for debugging
			if (isJsonString || isGenericContent || cleanText.length < 200) {
				logger.error('AI response is invalid or too short', {
					isJsonString,
					isGenericContent,
					textLength: cleanText.length,
					actualResponse: cleanText.substring(0, 500) // Log actual response for debugging
				});
				throw new Error(`AI response is invalid or incomplete (length: ${cleanText.length} chars). The response might be truncated. Please try again.`);
			} else {
				// Use cleaned text directly (only if it's not JSON)
				finalTitle = request.topic || 'Generated Title';
				content = cleanText;
			}

			// Ensure excerpt doesn't exceed 500 characters
			let excerpt = this.generateExcerpt(content);
			if (excerpt.length > 500) {
				excerpt = excerpt.substring(0, 497) + '...';
			}
			
			return {
				title: finalTitle,
				content: content,
				excerpt: excerpt,
				metaDescription: this.generateMetaDescription(content),
				metaTitle: finalTitle, // Meta title (default: same as title)
				metaKeywords: undefined, // Meta keywords (optional, not available in fallback)
				suggestedTags: this.extractTags(content),
				suggestedCategory: this.getCategoryFromTopic(request.topic || finalTitle),
				seoScore: 75,
				estimatedReadTime: this.calculateReadTime(content),
				provider: providerInfo?.provider,
				apiKey: providerInfo?.apiKey ? this.maskApiKey(providerInfo.apiKey) : undefined,
				model: providerInfo?.model
			};
		} catch (error) {
			logger.error('Failed to parse content response:', error);
			// No fallback - throw error and let user retry
			throw new Error('Failed to parse AI response. Please try again.');
		}
	}

	/**
	 * Parse SEO optimization response
	 */
	private parseSEOResponse(text: string, request: ISEOOptimizationRequest): ISEOOptimizationResponse {
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
					optimizedTitle: parsed.optimizedTitle || request.title,
					metaDescription: parsed.metaDescription || this.generateMetaDescription(request.content),
					suggestedKeywords: parsed.suggestedKeywords || this.extractTags(request.content),
					seoScore: parsed.seoScore || 75,
					improvements: parsed.improvements || []
				};
			} else {
				// If no JSON found, use fallback SEO optimization
				logger.warn('No valid JSON found in SEO response, using fallback optimization');
				return this.generateFallbackSEOResponse(request);
			}
		} catch (error) {
			logger.error('Failed to parse SEO response:', error);
			// Fallback to basic SEO optimization
			logger.warn('Using fallback SEO optimization due to parsing error');
			return this.generateFallbackSEOResponse(request);
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
	 * Generate image using Google Cloud Vertex AI (Imagen 4)
	 */
	private async generateImageWithVertexAI(request: IImageGenerationRequest): Promise<IImageGenerationResponse> {
		const { style = 'photographic', size = 'medium', aspectRatio = '16:9' } = request;
		
		// Build enhanced prompt for Imagen 4
		const enhancedPrompt = this.buildStableDiffusionPrompt(request);
		
		// Vertex AI API call using Imagen 4
		const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
		const location = 'us-central1'; // Default location for Imagen
		
		const response = await fetch(`https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagen-4.0-generate-001:predict`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${await this.getGoogleCloudAccessToken()}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				instances: [{
					prompt: enhancedPrompt,
					parameters: {
						numberOfImages: 1,
						aspectRatio: this.getVertexAIAspectRatio(aspectRatio),
						negativePrompt: 'blurry, low quality, distorted, deformed, text rendering issues',
						style: this.getVertexAIStyle(style)
					}
				}]
			})
		});
		
		if (!response.ok) {
			const errorText = await response.text();
			logger.error('Vertex AI Imagen 4 error details:', {
				status: response.status,
				statusText: response.statusText,
				errorBody: errorText,
				requestBody: {
					prompt: enhancedPrompt,
					aspectRatio: this.getVertexAIAspectRatio(aspectRatio),
					style: this.getVertexAIStyle(style)
				}
			});
			throw new Error(`Google Cloud Vertex AI Imagen 4 error: ${response.status} ${response.statusText} - ${errorText}`);
		}
		
		const result = await response.json();
		const imageData = result.predictions[0].bytesBase64Encoded;
		
		// Convert base64 to buffer and save to storage
		const imageBuffer = Buffer.from(imageData, 'base64');
		// Convert Buffer to ArrayBuffer
		const arrayBuffer = new ArrayBuffer(imageBuffer.length);
		const view = new Uint8Array(arrayBuffer);
		for (let i = 0; i < imageBuffer.length; i++) {
			view[i] = imageBuffer[i];
		}
		const savedImageUrl = await this.saveImageToStorage(arrayBuffer);
		
		return {
			imageUrl: savedImageUrl,
			prompt: enhancedPrompt,
			style,
			dimensions: this.calculateImageDimensions(size, aspectRatio),
			ttl: '12 hours'
		};
	}

	/**
	 * Get Google Cloud access token
	 */
	private async getGoogleCloudAccessToken(): Promise<string> {
		// This is a simplified version - in production, use proper Google Cloud authentication
		const { GoogleAuth: googleAuth } = await import('google-auth-library');
		const auth = new googleAuth({
			scopes: ['https://www.googleapis.com/auth/cloud-platform']
		});
		const client = await auth.getClient();
		const accessToken = await client.getAccessToken();
		return accessToken.token || '';
	}

	/**
	 * Get Vertex AI aspect ratio format
	 */
	private getVertexAIAspectRatio(aspectRatio: string): string {
		const ratioMap: Record<string, string> = {
			'1:1': '1:1',
			'16:9': '16:9',
			'9:16': '9:16',
			'4:3': '4:3',
			'3:4': '3:4',
			'3:2': '3:2',
			'2:3': '2:3'
		};
		return ratioMap[aspectRatio] || '1:1';
	}

	/**
	 * Get Vertex AI style format
	 */
	private getVertexAIStyle(style: string): string {
		const styleMap: Record<string, string> = {
			'photographic': 'photographic',
			'realistic': 'realistic',
			'artistic': 'artistic',
			'cartoon': 'cartoon',
			'anime': 'anime',
			'painting': 'painting',
			'sketch': 'sketch'
		};
		return styleMap[style] || 'photographic';
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
				model: 'dall-e-3',
				prompt: enhancedPrompt,
				n: 1,
				size: this.getDALLESize(size, aspectRatio)
			})
		});
		
		if (!response.ok) {
			const errorText = await response.text();
			logger.error('DALL-E API error details:', {
				status: response.status,
				statusText: response.statusText,
				errorBody: errorText,
				requestBody: {
					model: 'dall-e-3',
					prompt: enhancedPrompt,
					n: 1,
					size: this.getDALLESize(size, aspectRatio)
				}
			});
			
			// Parse error response to check for billing issues
			try {
				const errorData = JSON.parse(errorText);
				if (errorData.error?.code === 'billing_hard_limit_reached') {
					throw new Error(`OpenAI billing limit reached: ${errorData.error.message}`);
				}
			} catch (parseError) {
				// If parsing fails, use original error
			}
			
			throw new Error(`OpenAI DALL-E API error: ${response.status} ${response.statusText} - ${errorText}`);
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
	private getDALLESize(_size: string, aspectRatio: string): string {
		// DALL-E 3 only supports specific sizes
		if (aspectRatio === '1:1') return '1024x1024';
		if (aspectRatio === '16:9') return '1792x1024';
		if (aspectRatio === '9:16') return '1024x1792';
		
		// Default to square for other aspect ratios
		return '1024x1024';
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
	 * Max length: 500 characters (to match post validation)
	 */
	private generateExcerpt(content: string): string {
		// Remove HTML tags and markdown formatting
		const cleanContent = content
			.replace(/<[^>]*>/g, '') // Remove HTML tags
			.replace(/[#*`_~]/g, '') // Remove markdown
			.replace(/\s+/g, ' ') // Normalize whitespace
			.trim();
		
		// Get first 100 words (approximately 500 characters)
		const words = cleanContent.split(/\s+/);
		let excerpt = words.slice(0, 100).join(' ');
		
		// Ensure it doesn't exceed 500 characters
		if (excerpt.length > 500) {
			excerpt = excerpt.substring(0, 497) + '...';
		}
		
		return excerpt;
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
	 * Check if content is generic/template-like
	 */
	private isGenericContent(content: string, topic: string): boolean {
		const contentLower = content.toLowerCase();
		const topicLower = topic.toLowerCase();
		
		// Extract key words from topic
		const topicWords = topicLower
			.replace(/[^\w\s]/g, ' ')
			.split(/\s+/)
			.filter(word => word.length > 3);
		
		// Check if content contains topic-specific keywords
		const hasTopicKeywords = topicWords.some(word => contentLower.includes(word));
		
		// Generic phrases that indicate template content
		const genericPhrases = [
			'very interesting and relevant topic',
			'plays a very important role',
			'various aspects related to',
			'opens up various opportunities',
			'let\'s look at some reasons',
			'from a technical standpoint',
			'can be applied in various contexts',
			'if you\'re new to',
			'for those already familiar',
			'continues to evolve',
			'very promising',
			'key takeaways',
			'call to action',
			'halo pembaca',
			'sangat menarik dan relevan',
			'memiliki peran yang sangat penting',
			'berbagai aspek terkait',
			'membuka berbagai peluang',
			'mari kita lihat',
			'dari segi teknis',
			'dapat diterapkan dalam',
			'jika anda baru',
			'bagi yang sudah',
			'terus berkembang',
			'sangat menjanjikan'
		];
		
		// Check if content has too many generic phrases
		const genericPhraseCount = genericPhrases.filter(phrase => contentLower.includes(phrase)).length;
		const isTooGeneric = genericPhraseCount >= 3;
		
		// Content is generic if:
		// 1. It doesn't contain topic keywords AND has many generic phrases
		// 2. It has too many generic phrases (3 or more)
		return (!hasTopicKeywords && genericPhraseCount >= 2) || isTooGeneric;
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

	/**
	 * Generate content suggestions (multiple titles and ideas)
	 */
	async generateContentSuggestions(request: IContentSuggestionsRequest): Promise<IContentSuggestionsResponse> {
		try {
			this.validateConfig();

			const { topic, contentType, language, count = 5 } = request;

			// Translate topic to English if needed
			const { translatedTopic } = this.translateToEnglish(topic, []);

			// Build prompt for content suggestions
			const prompt = this.buildContentSuggestionsPrompt(translatedTopic, contentType, language, count);

			// Generate suggestions using AI
			const model = getTextModel();
			const result = await model.generateContent(prompt);
			const response = await result.response;
			const text = response.text();

			// Parse AI response
			const suggestions = this.parseContentSuggestionsResponse(text, count);

			return {
				suggestions,
				totalSuggestions: suggestions.length
			};

		} catch (error) {
			logger.error('Content suggestions generation failed:', error);
			
			// Fallback to default suggestions
			return this.generateFallbackContentSuggestions(request);
		}
	}

	/**
	 * Build prompt for content suggestions
	 */
	private buildContentSuggestionsPrompt(topic: string, contentType: string, language: string, count: number): string {
		const lang = language === 'en' ? 'English' : 'Indonesian';
		const contentTypeText = contentType.charAt(0).toUpperCase() + contentType.slice(1);

		return `You are a professional content strategist. Generate ${count} creative and engaging ${contentTypeText} title suggestions about "${topic}".

Requirements:
- Language: ${lang}
- Content Type: ${contentTypeText}
- Each title should be unique and compelling
- Include brief excerpt (1-2 sentences) for each title
- Estimate reading time for each suggestion
- Calculate SEO score (0-100) for each title
- Suggest relevant tags for each title
- Suggest appropriate category for each title

Please provide the response in the following JSON format:
{
  "suggestions": [
    {
      "title": "Compelling title 1",
      "excerpt": "Brief description of what this content would cover",
      "estimatedReadTime": 5,
      "seoScore": 85,
      "suggestedTags": ["tag1", "tag2", "tag3"],
      "suggestedCategory": "Category Name"
    },
    {
      "title": "Compelling title 2",
      "excerpt": "Brief description of what this content would cover",
      "estimatedReadTime": 7,
      "seoScore": 90,
      "suggestedTags": ["tag1", "tag2", "tag3"],
      "suggestedCategory": "Category Name"
    }
  ]
}`;
	}

	/**
	 * Parse content suggestions response from AI
	 */
	private parseContentSuggestionsResponse(text: string, expectedCount: number): any[] {
		try {
			// Try to extract JSON from the response
			let jsonText = text.trim();
			
			// Remove markdown code blocks if present
			if (jsonText.includes('```json')) {
				jsonText = jsonText.split('```json')[1].split('```')[0].trim();
			} else if (jsonText.includes('```')) {
				jsonText = jsonText.split('```')[1].split('```')[0].trim();
			}

			// Try to find JSON object
			const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
			if (jsonMatch) {
				jsonText = jsonMatch[0];
			}

			const parsed = JSON.parse(jsonText);
			
			if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
				return parsed.suggestions.slice(0, expectedCount);
			}

			throw new Error('Invalid response format');
		} catch (error) {
			logger.warn('Failed to parse content suggestions response, using fallback');
			return this.generateFallbackSuggestions(expectedCount);
		}
	}

	/**
	 * Generate fallback content suggestions when AI fails
	 */
	private generateFallbackContentSuggestions(request: IContentSuggestionsRequest): IContentSuggestionsResponse {
		const { topic, contentType, count = 5 } = request;
		const suggestions = [];

		for (let i = 1; i <= count; i++) {
			suggestions.push({
				title: `${topic}: ${this.getFallbackTitleVariation(i, contentType)}`,
				excerpt: `This ${contentType} explores various aspects of ${topic} and provides valuable insights.`,
				estimatedReadTime: Math.floor(Math.random() * 10) + 3,
				seoScore: Math.floor(Math.random() * 20) + 70,
				suggestedTags: this.getFallbackTags(topic),
				suggestedCategory: this.getCategoryFromTopic(topic)
			});
		}

		return {
			suggestions,
			totalSuggestions: suggestions.length
		};
	}

	/**
	 * Generate fallback suggestions when parsing fails
	 */
	private generateFallbackSuggestions(count: number): any[] {
		const suggestions = [];
		const baseTitles = [
			'Ultimate Guide to',
			'Complete Beginner\'s Guide to',
			'Advanced Techniques for',
			'Best Practices for',
			'Common Mistakes in',
			'Step-by-Step Tutorial:',
			'Everything You Need to Know About',
			'Pro Tips for',
			'Comprehensive Overview of',
			'Expert Insights on'
		];

		for (let i = 0; i < count; i++) {
			const title = baseTitles[i % baseTitles.length] + ' Your Topic';
			suggestions.push({
				title,
				excerpt: 'A detailed exploration of the topic with practical examples and actionable advice.',
				estimatedReadTime: Math.floor(Math.random() * 10) + 3,
				seoScore: Math.floor(Math.random() * 20) + 70,
				suggestedTags: ['guide', 'tutorial', 'tips'],
				suggestedCategory: 'General'
			});
		}

		return suggestions;
	}

	/**
	 * Get fallback title variations
	 */
	private getFallbackTitleVariation(index: number, contentType: string): string {
		const variations = {
			blog: ['Complete Guide', 'Ultimate Tips', 'Best Practices', 'Common Mistakes', 'Expert Insights'],
			article: ['In-Depth Analysis', 'Comprehensive Review', 'Detailed Overview', 'Professional Guide', 'Technical Deep Dive'],
			tutorial: ['Step-by-Step Guide', 'Beginner\'s Tutorial', 'Advanced Techniques', 'Practical Examples', 'Hands-On Learning'],
			news: ['Latest Updates', 'Breaking News', 'Recent Developments', 'Industry Report', 'Trend Analysis'],
			review: ['Honest Review', 'Detailed Comparison', 'Pros and Cons', 'User Experience', 'Performance Analysis']
		};

		const typeVariations = variations[contentType as keyof typeof variations] || variations.blog;
		return typeVariations[index % typeVariations.length];
	}

	/**
	 * Get fallback tags based on topic
	 */
	private getFallbackTags(topic: string): string[] {
		const topicLower = topic.toLowerCase();
		const tags = [];

		if (topicLower.includes('react') || topicLower.includes('javascript')) {
			tags.push('javascript', 'react', 'programming');
		} else if (topicLower.includes('business') || topicLower.includes('marketing')) {
			tags.push('business', 'marketing', 'strategy');
		} else if (topicLower.includes('design') || topicLower.includes('ui')) {
			tags.push('design', 'ui', 'ux');
		} else {
			tags.push('guide', 'tips', 'tutorial');
		}

		return tags;
	}

	/**
	 * Test Zenmux API to see response format
	 * Documentation: https://docs.zenmux.ai/guide/quickstart.html
	 * @param prompt - The prompt to send to ZenMux
	 * @param model - Optional model name (format: "provider/model-name"). Default: "openai/gpt-4o-mini"
	 */
	async testZenmuxAPI(prompt: string, model?: string): Promise<any> {
		try {
			const ZENMUX_API_KEY = 'sk-ai-v1-e81eab413add52c02c22adc89e96f62b49ada81d493f7aafe6b68d6bea66b674';
			// Correct endpoint according to ZenMux documentation
			const ZENMUX_API_URL = 'https://zenmux.ai/api/v1/chat/completions';
			
			// Use model from parameter or default
			// Note: Some models require credits (error 402). Try different models if you get credit error.
			// Available models can be checked at: https://zenmux.ai/models
			// Common models to try: "openai/gpt-4o-mini", "openai/gpt-3.5-turbo", "anthropic/claude-3-haiku"
			const selectedModel = model || 'z-ai/glm-4.6v-flash';
			
			logger.info('Testing Zenmux API...', { 
				promptLength: prompt.length,
				model: selectedModel
			});
			
			const response = await fetch(ZENMUX_API_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${ZENMUX_API_KEY}`
				},
				body: JSON.stringify({
					// Model format must be "provider/model-name" according to ZenMux docs
					// Examples: "openai/gpt-5", "anthropic/claude-sonnet-4.5"
					model: selectedModel,
					messages: [
						{
							role: 'user',
							content: prompt
						}
					],
					temperature: 0.7,
					max_tokens: 2000
				})
			});
			
			if (!response.ok) {
				const errorText = await response.text();
				let errorData;
				try {
					errorData = JSON.parse(errorText);
				} catch {
					errorData = { raw: errorText };
				}
				
				logger.error('Zenmux API error:', {
					status: response.status,
					statusText: response.statusText,
					error: errorData
				});
				
				// Provide more helpful error message
				if (errorData.error?.code === 'invalid_model') {
					throw new Error(`Model "${selectedModel}" tidak valid. Silakan gunakan model yang tersedia di ZenMux. Contoh: "openai/gpt-5", "anthropic/claude-sonnet-4.5". Error detail: ${errorText}`);
				}
				
				// Handle credit/balance required error
				if (errorData.error?.code === '402' || errorData.error?.type === 'reject_no_credit' || response.status === 402) {
					const errorMsg = `⚠️ Akun ZenMux memerlukan credit/balance untuk menggunakan model "${selectedModel}".\n\n` +
						'Solusi:\n' +
						'1. Top up credit di dashboard ZenMux: https://zenmux.ai\n' +
						'2. Atau coba model lain dengan mengirim parameter "model" di request body\n' +
						'3. Atau gunakan Gemini API (default) yang masih memiliki free tier\n\n' +
						`Error detail: ${errorData.error?.message || errorText}`;
					throw new Error(errorMsg);
				}
				
				throw new Error(`Zenmux API error: ${response.status} ${response.statusText} - ${errorText}`);
			}
			
			const data = await response.json();
			logger.info('Zenmux API response received', {
				hasChoices: !!data.choices,
				choicesLength: data.choices?.length || 0,
				responseKeys: Object.keys(data),
				model: data.model
			});
			
			return data;
		} catch (error) {
			logger.error('Zenmux API test failed:', error);
			throw error;
		}
	}

	/**
	 * Generate content using ZenMux API as fallback
	 * This method will be used when Gemini API fails
	 * Note: ZenMux requires credits/balance in the account
	 */
	async generateContentWithZenmux(request: IContentGenerationRequest, model?: string): Promise<IContentGenerationResponse> {
		try {
			const ZENMUX_API_KEY = 'sk-ai-v1-e81eab413add52c02c22adc89e96f62b49ada81d493f7aafe6b68d6bea66b674';
			const ZENMUX_API_URL = 'https://zenmux.ai/api/v1/chat/completions';
			
			// Use model from parameter or default
			const selectedModel = model || 'kuaishou/kat-coder-pro-v1';
			
			// Translate topic and keywords if generating English content
			let finalTopic = request.topic;
			let finalKeywords = request.keywords || [];
			
			if (request.language === 'en') {
				const translation = this.translateToEnglish(request.topic, request.keywords || []);
				finalTopic = translation.translatedTopic;
				finalKeywords = translation.translatedKeywords;
			}
			
			// Build the same prompt as Gemini
			const prompt = this.buildContentPrompt(request);
			
			logger.info('Generating content with ZenMux API (fallback)...', {
				originalTopic: request.topic,
				translatedTopic: finalTopic,
				contentType: request.contentType,
				language: request.language,
				model: selectedModel
			});
			
			const response = await fetch(ZENMUX_API_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${ZENMUX_API_KEY}`
				},
				body: JSON.stringify({
					model: selectedModel,
					messages: [
						{
							role: 'user',
							content: prompt
						}
					],
					temperature: 0.7,
					max_tokens: 16384 // Same as Gemini max tokens
				})
			});
			
			if (!response.ok) {
				const errorText = await response.text();
				let errorData;
				try {
					errorData = JSON.parse(errorText);
				} catch {
					errorData = { raw: errorText };
				}
				
				logger.error('ZenMux API error during content generation:', {
					status: response.status,
					error: errorData
				});
				
				// Handle credit/balance required error
				if (errorData.error?.code === '402' || errorData.error?.type === 'reject_no_credit' || response.status === 402) {
					throw new Error(`ZenMux memerlukan credit/balance. Silakan top up credit di https://zenmux.ai atau gunakan Gemini API. Error: ${errorData.error?.message || errorText}`);
				}
				
				throw new Error(`ZenMux API error: ${response.status} ${response.statusText} - ${errorText}`);
			}
			
			const data = await response.json();
			const zenmuxContent = data.choices?.[0]?.message?.content || '';
			
			logger.info('ZenMux content generated successfully', {
				contentLength: zenmuxContent.length,
				model: data.model
			});
			
			// Create modified request with translated topic/keywords for response
			const modifiedRequest = {
				...request,
				topic: finalTopic,
				keywords: finalKeywords
			};
			
			// Add provider info for ZenMux (use existing ZENMUX_API_KEY from above)
			const providerInfo = {
				provider: 'zenmux' as const,
				apiKey: ZENMUX_API_KEY,
				model: selectedModel
			};
			
			// Parse the response using the same parser as Gemini
			return this.parseContentResponse(zenmuxContent, modifiedRequest, providerInfo);
		} catch (error) {
			logger.error('ZenMux content generation failed:', error);
			throw error;
		}
	}
}

// Export singleton instance
export const aiService = AIService.getInstance();
export default aiService;
