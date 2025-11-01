import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Google OAuth Configuration
export const GOOGLE_OAUTH_CONFIG = {
	// Google OAuth 2.0 credentials
	CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
	CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
	
	// Frontend URL (for OAuth redirect)
	FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
	
	// OAuth callback URL (redirect ke frontend untuk handle callback)
	CALLBACK_URL: process.env.GOOGLE_OAUTH_CALLBACK_URL || 'http://localhost:5173/auth/google/callback',
	
	// Scopes to request from Google
	SCOPES: ['profile', 'email'],
	
	// JWT configuration for session management
	JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret_here',
	JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d'
};

// Validate Google OAuth configuration
export const validateGoogleOAuthConfig = (): boolean => {
	if (!GOOGLE_OAUTH_CONFIG.CLIENT_ID || GOOGLE_OAUTH_CONFIG.CLIENT_ID === 'your_google_oauth_client_id_here') {
		throw new Error('GOOGLE_OAUTH_CLIENT_ID is required for Google OAuth. Please set a valid client ID in your .env file.');
	}
	
	if (!GOOGLE_OAUTH_CONFIG.CLIENT_SECRET || GOOGLE_OAUTH_CONFIG.CLIENT_SECRET === 'your_google_oauth_client_secret_here') {
		throw new Error('GOOGLE_OAUTH_CLIENT_SECRET is required for Google OAuth. Please set a valid client secret in your .env file.');
	}
	
	return true;
};

export default {
	GOOGLE_OAUTH_CONFIG,
	validateGoogleOAuthConfig
};
