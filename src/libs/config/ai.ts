import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

// AI Configuration
export const AI_CONFIG = {
	// Google Gemini API
	GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
	GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
	
	// Content Generation Settings
	MAX_TOKENS: parseInt(process.env.AI_MAX_TOKENS || '2048'),
	TEMPERATURE: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
	
	// Image Generation Settings
	IMAGE_MODEL: process.env.AI_IMAGE_MODEL || 'gemini-2.5-flash',
	IMAGE_QUALITY: process.env.AI_IMAGE_QUALITY || 'standard',
	IMAGE_STYLE: process.env.AI_IMAGE_STYLE || 'photographic',
	
	// Rate Limiting
	RATE_LIMIT_PER_MINUTE: parseInt(process.env.AI_RATE_LIMIT || '60'),
	RATE_LIMIT_PER_HOUR: parseInt(process.env.AI_RATE_LIMIT_HOUR || '1000'),
};

// Initialize Google Gemini AI
export const genAI = new GoogleGenerativeAI(AI_CONFIG.GEMINI_API_KEY);

// Get text generation model
export const getTextModel = () => {
	return genAI.getGenerativeModel({ 
		model: AI_CONFIG.GEMINI_MODEL,
		generationConfig: {
			maxOutputTokens: AI_CONFIG.MAX_TOKENS,
			temperature: AI_CONFIG.TEMPERATURE,
		}
	});
};

// Get image generation model
export const getImageModel = () => {
	return genAI.getGenerativeModel({ 
		model: AI_CONFIG.IMAGE_MODEL,
		generationConfig: {
			maxOutputTokens: AI_CONFIG.MAX_TOKENS,
			temperature: AI_CONFIG.TEMPERATURE,
		}
	});
};

// Validate AI configuration
export const validateAIConfig = (): boolean => {
	if (!AI_CONFIG.GEMINI_API_KEY) {
		throw new Error('GEMINI_API_KEY is required for AI features');
	}
	return true;
};

export default {
	AI_CONFIG,
	genAI,
	getTextModel,
	getImageModel,
	validateAIConfig
};
