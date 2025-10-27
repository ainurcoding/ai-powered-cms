import { TRequestFunction, InvalidParameterException } from '@libs/core';
import GoogleOAuthService from '@libs/services/googleOAuthService';
import { GOOGLE_OAUTH_CONFIG, validateGoogleOAuthConfig } from '@libs/config/googleOAuth';
import logger from '@libs/core/logger';

// Initialize Google OAuth service
const googleOAuthService = new GoogleOAuthService();

/**
 * Get Google OAuth authorization URL
 */
const getGoogleAuthUrl: TRequestFunction = async (_req) => {
	try {
		// Validate configuration
		validateGoogleOAuthConfig();

		const authUrl = googleOAuthService.getAuthUrl();

		return {
			result: {
				authUrl,
				message: 'Gunakan URL ini untuk redirect ke Google OAuth'
			}
		};
	} catch (error: any) {
		logger.error('Error getting Google auth URL:', error);
		throw new InvalidParameterException(error.message || 'Failed to get Google auth URL');
	}
};

/**
 * Handle Google OAuth callback
 */
const handleGoogleCallback: TRequestFunction = async (req) => {
	try {
		const { code, error, error_description } = req.query;

		// Check for OAuth errors
		if (error) {
			logger.error('Google OAuth error:', { error, error_description });
			throw new InvalidParameterException(`Google OAuth error: ${error_description || error}`);
		}

		if (!code) {
			throw new InvalidParameterException('Authorization code not provided');
		}

		// Exchange code for access token
		const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({
				client_id: GOOGLE_OAUTH_CONFIG.CLIENT_ID,
				client_secret: GOOGLE_OAUTH_CONFIG.CLIENT_SECRET,
				code: code as string,
				grant_type: 'authorization_code',
				redirect_uri: GOOGLE_OAUTH_CONFIG.CALLBACK_URL,
			}),
		});

		if (!tokenResponse.ok) {
			const errorText = await tokenResponse.text();
			logger.error('Token exchange failed:', { status: tokenResponse.status, error: errorText });
			throw new InvalidParameterException('Failed to exchange authorization code for token');
		}

		const tokenData = await tokenResponse.json();
		const { access_token } = tokenData;

		// Get user profile from Google
		const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
			headers: {
				Authorization: `Bearer ${access_token}`,
			},
		});

		if (!profileResponse.ok) {
			const errorText = await profileResponse.text();
			logger.error('Profile fetch failed:', { status: profileResponse.status, error: errorText });
			throw new InvalidParameterException('Failed to fetch user profile from Google');
		}

		const profile = await profileResponse.json();

		// Process Google OAuth callback
		const result = await googleOAuthService.processGoogleCallback(profile);

		return {
			result: {
				user: result.user,
				token: result.token,
				isNewUser: result.isNewUser,
				message: result.isNewUser ? 'Akun berhasil dibuat dan login' : 'Login berhasil'
			}
		};

	} catch (error: any) {
		logger.error('Google OAuth callback error:', error);
		throw new InvalidParameterException(error.message || 'Google OAuth callback failed');
	}
};

/**
 * Test Google OAuth configuration
 */
const testGoogleConfig: TRequestFunction = async (_req) => {
	try {
		validateGoogleOAuthConfig();

		return {
			result: {
				clientId: GOOGLE_OAUTH_CONFIG.CLIENT_ID ? 'Set' : 'Not set',
				clientSecret: GOOGLE_OAUTH_CONFIG.CLIENT_SECRET ? 'Set' : 'Not set',
				callbackUrl: GOOGLE_OAUTH_CONFIG.CALLBACK_URL,
				scopes: GOOGLE_OAUTH_CONFIG.SCOPES,
				message: 'Google OAuth configuration is valid'
			}
		};
	} catch (error: any) {
		logger.error('Google OAuth config test failed:', error);
		throw new InvalidParameterException(error.message || 'Google OAuth configuration is invalid');
	}
};

export default {
	getGoogleAuthUrl,
	handleGoogleCallback,
	testGoogleConfig
};
