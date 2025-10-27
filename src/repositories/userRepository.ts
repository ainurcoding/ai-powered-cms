import postgresConnection from '@libs/config/postgresConnection';
import { v4 as uuidv4 } from 'uuid';
import logger from '@libs/core/logger';

export class UserRepository {
	/**
	 * Find user by Google ID
	 */
	async findByGoogleId(googleId: string): Promise<Entity.IUser | null> {
		try {
			const user = await postgresConnection.queryOne<Entity.IUser>(
				'SELECT * FROM users WHERE google_id = $1 AND is_active = true LIMIT 1',
				[googleId]
			);
			return user;
		} catch (error) {
			logger.error('Error finding user by Google ID:', error);
			throw new Error('Failed to find user by Google ID');
		}
	}

	/**
	 * Find user by email
	 */
	async findByEmail(email: string): Promise<Entity.IUser | null> {
		try {
			const user = await postgresConnection.queryOne<Entity.IUser>(
				'SELECT * FROM users WHERE email = $1 AND is_active = true LIMIT 1',
				[email]
			);
			return user;
		} catch (error) {
			logger.error('Error finding user by email:', error);
			throw new Error('Failed to find user by email');
		}
	}

	/**
	 * Create new user with Google OAuth data
	 */
	async createGoogleUser(userData: {
		googleId: string;
		email: string;
		name: string;
		username: string;
		avatar?: string;
		role: string;
		isActive: boolean;
	}): Promise<Entity.IUser> {
		try {
			const id = uuidv4();
			const now = new Date();

			const user = await postgresConnection.queryOne<Entity.IUser>(
				`INSERT INTO users (
					id, google_id, email, name, username, avatar, role, is_active, created_at, updated_at
				) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
				RETURNING *`,
				[
					id,
					userData.googleId,
					userData.email,
					userData.name,
					userData.username,
					userData.avatar,
					userData.role,
					userData.isActive,
					now,
					now
				]
			);

			logger.info('Created new Google user', { userId: user.id, email: user.email });
			return user;
		} catch (error) {
			logger.error('Error creating Google user:', error);
			throw new Error('Failed to create Google user');
		}
	}

	/**
	 * Update existing user with Google profile data
	 */
	async updateGoogleProfile(userId: string, profileData: {
		name: string;
		email: string;
		avatar?: string;
		googleId: string;
	}): Promise<Entity.IUser> {
		try {
			const now = new Date();

			const user = await postgresConnection.queryOne<Entity.IUser>(
				`UPDATE users SET 
					name = $2, 
					email = $3, 
					avatar = $4, 
					google_id = $5, 
					updated_at = $6
				WHERE id = $1 AND is_active = true
				RETURNING *`,
				[
					userId,
					profileData.name,
					profileData.email,
					profileData.avatar,
					profileData.googleId,
					now
				]
			);

			if (!user) {
				throw new Error('User not found');
			}

			logger.info('Updated Google profile', { userId: user.id });
			return user;
		} catch (error) {
			logger.error('Error updating Google profile:', error);
			throw new Error('Failed to update Google profile');
		}
	}

	/**
	 * Link Google account to existing user
	 */
	async linkGoogleAccount(userId: string, googleData: {
		googleId: string;
		avatar?: string;
	}): Promise<Entity.IUser> {
		try {
			const now = new Date();

			const user = await postgresConnection.queryOne<Entity.IUser>(
				`UPDATE users SET 
					google_id = $2, 
					avatar = COALESCE($3, avatar), 
					updated_at = $4
				WHERE id = $1 AND is_active = true
				RETURNING *`,
				[userId, googleData.googleId, googleData.avatar, now]
			);

			if (!user) {
				throw new Error('User not found');
			}

			logger.info('Linked Google account', { userId: user.id, googleId: googleData.googleId });
			return user;
		} catch (error) {
			logger.error('Error linking Google account:', error);
			throw new Error('Failed to link Google account');
		}
	}

	/**
	 * Find user by ID
	 */
	async findById(userId: string): Promise<Entity.IUser | null> {
		try {
			const user = await postgresConnection.queryOne<Entity.IUser>(
				'SELECT * FROM users WHERE id = $1 AND is_active = true LIMIT 1',
				[userId]
			);
			return user;
		} catch (error) {
			logger.error('Error finding user by ID:', error);
			throw new Error('Failed to find user by ID');
		}
	}

	/**
	 * Check if username is available
	 */
	async isUsernameAvailable(username: string): Promise<boolean> {
		try {
			const user = await postgresConnection.queryOne<Entity.IUser>(
				'SELECT id FROM users WHERE username = $1 LIMIT 1',
				[username]
			);
			return !user;
		} catch (error) {
			logger.error('Error checking username availability:', error);
			throw new Error('Failed to check username availability');
		}
	}

	/**
	 * Check if email is available
	 */
	async isEmailAvailable(email: string): Promise<boolean> {
		try {
			const user = await postgresConnection.queryOne<Entity.IUser>(
				'SELECT id FROM users WHERE email = $1 LIMIT 1',
				[email]
			);
			return !user;
		} catch (error) {
			logger.error('Error checking email availability:', error);
			throw new Error('Failed to check email availability');
		}
	}
}

export default UserRepository;
