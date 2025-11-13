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
 * - Jika dipanggil dari Google (browser redirect): redirect ke frontend dengan code
 * - Jika dipanggil dari frontend (API call): exchange code dengan token dan return JSON
 */
const handleGoogleCallback: TRequestFunction = async (req, res) => {
	try {
		const { code, error, error_description, state } = req.query;
		const frontendUrl = GOOGLE_OAUTH_CONFIG.FRONTEND_URL;

		// Check for OAuth errors from Google
		if (error) {
			const errorStr = Array.isArray(error) ? error[0] : error;
			const errorDescStr = error_description 
				? (Array.isArray(error_description) ? error_description[0] : error_description)
				: errorStr;
			logger.error('Google OAuth error:', { error: errorStr, error_description: errorDescStr });
			const errorMessage = encodeURIComponent(String(errorDescStr));
			
			// Check if this is an API call from frontend (has Accept: application/json header)
			const isApiCall = req.headers.accept?.includes('application/json');
			
			if (isApiCall) {
				// Return JSON error for API call
				throw new InvalidParameterException(`Google OAuth error: ${errorDescStr}`);
			} else {
				// Redirect to frontend with error for browser redirect
				res.redirect(302, `${frontendUrl}/auth/google/callback?error=${errorMessage}`);
				return;
			}
		}

		if (!code) {
			const errorMessage = 'Authorization code not provided';
			logger.error(errorMessage);
			
			// Check if this is an API call from frontend
			const isApiCall = req.headers.accept?.includes('application/json');
			
			if (isApiCall) {
				throw new InvalidParameterException(errorMessage);
			} else {
				res.redirect(302, `${frontendUrl}/auth/google/callback?error=${encodeURIComponent(errorMessage)}`);
				return;
			}
		}

		// Check if this is an API call from frontend
		// Frontend akan call dengan header Accept: application/json
		// Google browser redirect biasanya tidak akan ada header Accept: application/json
		const acceptHeader = req.headers.accept || '';
		const isApiCall = acceptHeader.includes('application/json');

		logger.info('Google OAuth callback request details', {
			hasAcceptHeader: !!req.headers.accept,
			acceptHeader: acceptHeader,
			referer: req.headers.referer || req.headers.referrer || 'none',
			userAgent: req.headers['user-agent']?.substring(0, 50) || 'none',
			isApiCall: isApiCall,
			codeLength: (code as string)?.length || 0
		});

		if (isApiCall) {
			// Frontend API call: exchange code with token and return JSON
			logger.info('Detected API call from frontend, exchanging code with token');
			return await exchangeCodeForToken(code as string);
		} else {
			// Google browser redirect: redirect to frontend with code
			const codeStr = code as string;
			const stateStr = state ? (Array.isArray(state) ? state[0] : state) : null;
			const redirectUrl = stateStr
				? `${frontendUrl}/auth/google/callback?code=${encodeURIComponent(codeStr)}&state=${encodeURIComponent(String(stateStr))}`
				: `${frontendUrl}/auth/google/callback?code=${encodeURIComponent(codeStr)}`;

			logger.info('Detected browser redirect from Google, redirecting to frontend with code', {
				frontendUrl: redirectUrl
			});

			// Redirect to frontend with code
			res.redirect(302, redirectUrl);
			return;
		}

	} catch (error: any) {
		logger.error('Google OAuth callback error:', error);
		
		// Check if this is an API call from frontend
		const isApiCall = req.headers.accept?.includes('application/json');
		
		if (isApiCall) {
			// Return JSON error for API call
			throw new InvalidParameterException(error.message || 'Google OAuth callback failed');
		} else {
			// Redirect to frontend with error for browser redirect
			const frontendUrl = GOOGLE_OAUTH_CONFIG.FRONTEND_URL;
			const errorMessage = encodeURIComponent(error.message || 'Google OAuth callback failed');
			res.redirect(302, `${frontendUrl}/auth/google/callback?error=${errorMessage}`);
		}
	}
};

/**
 * Exchange authorization code with token
 * Used by frontend to exchange code with token after receiving code from Google
 */
const exchangeCodeForToken = async (code: string): Promise<any> => {
	try {
		// Validate configuration first
		if (!GOOGLE_OAUTH_CONFIG.CLIENT_ID || !GOOGLE_OAUTH_CONFIG.CLIENT_SECRET) {
			logger.error('Google OAuth credentials not configured', {
				hasClientId: !!GOOGLE_OAUTH_CONFIG.CLIENT_ID,
				hasClientSecret: !!GOOGLE_OAUTH_CONFIG.CLIENT_SECRET
			});
			throw new InvalidParameterException('Google OAuth credentials are not configured. Please check CLIENT_ID and CLIENT_SECRET in .env file.');
		}

		// Trim whitespace from credentials (sometimes .env files have trailing spaces)
		const clientId = GOOGLE_OAUTH_CONFIG.CLIENT_ID.trim();
		const clientSecret = GOOGLE_OAUTH_CONFIG.CLIENT_SECRET.trim();
		const redirectUri = GOOGLE_OAUTH_CONFIG.CALLBACK_URL.trim();

		// Log configuration for debugging (without exposing secret)
		logger.info('Exchanging code for token', {
			clientId: clientId ? `${clientId.substring(0, 20)}...` : 'NOT SET',
			clientIdLength: clientId.length,
			clientSecret: clientSecret ? 'SET' : 'NOT SET',
			clientSecretLength: clientSecret.length,
			redirectUri: redirectUri,
			codeLength: code.length
		});

		// Build request body
		const requestBody = new URLSearchParams({
			client_id: clientId,
			client_secret: clientSecret,
			code: code,
			grant_type: 'authorization_code',
			redirect_uri: redirectUri,
		});

		// Log request details (without exposing secret)
		logger.debug('Token exchange request', {
			clientId: `${clientId.substring(0, 20)}...`,
			redirectUri: redirectUri,
			codeLength: code.length,
			requestBodyKeys: Array.from(requestBody.keys())
		});

		// Exchange code for access token
		const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: requestBody,
		});

		if (!tokenResponse.ok) {
			const errorText = await tokenResponse.text();
			
			// Parse error response for better error message
			let errorMessage = 'Failed to exchange authorization code for token';
			let errorCode = 'unknown_error';
			let errorDescription = '';
			
			try {
				const errorData = JSON.parse(errorText);
				errorCode = errorData.error || 'unknown_error';
				errorDescription = errorData.error_description || '';
				
				if (errorData.error === 'invalid_client') {
					errorMessage = 'Invalid Google OAuth client credentials. Please verify: 1) CLIENT_ID and CLIENT_SECRET are correct in .env file, 2) Redirect URI matches Google Cloud Console (http://localhost:8000/auth/google/callback), 3) Client Secret has not been reset.';
				} else if (errorData.error === 'invalid_grant') {
					errorMessage = 'Authorization code is invalid or has expired. This could mean: 1) Code was already used, 2) Code expired (tokens expire after a few minutes), 3) Redirect URI mismatch. Please try logging in again.';
				} else if (errorData.error === 'redirect_uri_mismatch') {
					errorMessage = `Redirect URI mismatch. Expected: ${redirectUri}. Please check Google Cloud Console and ensure the redirect URI matches exactly.`;
				} else if (errorData.error_description) {
					errorMessage = errorData.error_description;
				}
			} catch (e) {
				// If error response is not JSON, use default message
				logger.warn('Error response is not JSON', { errorText });
			}
			
			logger.error('Token exchange failed:', { 
				status: tokenResponse.status, 
				errorCode: errorCode,
				errorDescription: errorDescription,
				errorText: errorText,
				clientId: clientId ? `${clientId.substring(0, 20)}...` : 'NOT SET',
				clientIdLength: clientId.length,
				clientSecretLength: clientSecret.length,
				redirectUri: redirectUri,
				suggestion: errorCode === 'invalid_client' ? 'Check Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID → Authorized redirect URIs' : 'Check error description above'
			});
			
			throw new InvalidParameterException(errorMessage);
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

		logger.info('Google OAuth token exchange successful', {
			userId: result.user.id,
			isNewUser: result.isNewUser
		});

		// Return JSON response for frontend
		return {
			result: {
				user: result.user,
				token: result.token,
				isNewUser: result.isNewUser,
				message: result.isNewUser ? 'Akun berhasil dibuat dan login' : 'Login berhasil'
			}
		};

	} catch (error: any) {
		logger.error('Token exchange error:', error);
		throw error;
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
