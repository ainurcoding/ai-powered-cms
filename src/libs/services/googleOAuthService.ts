import { UserRepository } from '@repositories/userRepository';
import { GOOGLE_OAUTH_CONFIG } from '@libs/config/googleOAuth';
import jwt from 'jsonwebtoken';
import logger from '@libs/core/logger';

export interface GoogleUserProfile {
	id: string;
	email: string;
	name: string;
	picture?: string;
	verified_email: boolean;
}

export interface GoogleOAuthResult {
	user: {
		id: string;
		username: string;
		email: string;
		name: string;
		role: string;
		avatar?: string;
		isActive: boolean;
	};
	token: string;
	isNewUser: boolean;
}

export class GoogleOAuthService {
	private userRepository: UserRepository;

	constructor() {
		this.userRepository = new UserRepository();
	}

	/**
	 * Process Google OAuth callback and create/update user
	 */
	async processGoogleCallback(profile: GoogleUserProfile): Promise<GoogleOAuthResult> {
		try {
			logger.info('Processing Google OAuth callback', {
				googleId: profile.id,
				email: profile.email,
				name: profile.name
			});

			// Check if user already exists by Google ID
			let user = await this.userRepository.findByGoogleId(profile.id);

			if (user) {
				// Update existing user with latest Google profile data
				user = await this.userRepository.updateGoogleProfile(user.id, {
					name: profile.name,
					email: profile.email,
					avatar: profile.picture,
					googleId: profile.id
				});

				logger.info('Updated existing Google user', { userId: user.id });
			} else {
				// Check if user exists by email
				const existingUser = await this.userRepository.findByEmail(profile.email);
				
				if (existingUser) {
					// Link Google account to existing user
					user = await this.userRepository.linkGoogleAccount(existingUser.id, {
						googleId: profile.id,
						avatar: profile.picture
					});

					logger.info('Linked Google account to existing user', { userId: user.id });
				} else {
					// Create new user
					user = await this.userRepository.createGoogleUser({
						googleId: profile.id,
						email: profile.email,
						name: profile.name,
						username: this.generateUsername(profile.name, profile.email),
						avatar: profile.picture,
						role: 'USER',
						isActive: true
					});

					logger.info('Created new Google user', { userId: user.id });
				}
			}

			// Generate JWT token
			const token = this.generateJWTToken(user);

			return {
				user: {
					id: user.id,
					username: user.username,
					email: user.email,
					name: user.name,
					role: user.role,
					avatar: user.avatar,
					isActive: user.is_active
				},
				token,
				isNewUser: !user
			};

		} catch (error) {
			logger.error('Google OAuth callback processing failed:', error);
			throw new Error('Failed to process Google OAuth callback');
		}
	}

	/**
	 * Generate JWT token for user
	 */
	private generateJWTToken(user: any): string {
		const payload = {
			id: user.id,
			username: user.username,
			email: user.email,
			role: user.role
		};

		return jwt.sign(payload, GOOGLE_OAUTH_CONFIG.JWT_SECRET, {
			expiresIn: GOOGLE_OAUTH_CONFIG.JWT_EXPIRES_IN
		});
	}

	/**
	 * Generate unique username from name and email
	 */
	private generateUsername(name: string, _email: string): string {
		// Create username from name (lowercase, replace spaces with dots)
		let baseUsername = name.toLowerCase()
			.replace(/[^a-z0-9\s]/g, '') // Remove special characters
			.replace(/\s+/g, '.') // Replace spaces with dots
			.substring(0, 20); // Limit length

		// Add random number to ensure uniqueness
		const randomSuffix = Math.floor(Math.random() * 1000);
		return `${baseUsername}.${randomSuffix}`;
	}

	/**
	 * Get Google OAuth authorization URL
	 */
	getAuthUrl(): string {
		const params = new URLSearchParams({
			client_id: GOOGLE_OAUTH_CONFIG.CLIENT_ID,
			redirect_uri: GOOGLE_OAUTH_CONFIG.CALLBACK_URL,
			scope: GOOGLE_OAUTH_CONFIG.SCOPES.join(' '),
			response_type: 'code',
			access_type: 'offline',
			prompt: 'consent'
		});

		return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
	}
}

export default GoogleOAuthService;
