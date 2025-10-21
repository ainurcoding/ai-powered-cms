import logger from './logger';

/**
 * Simple in-memory token blacklist
 * In production, use Redis for scalability
 */
class TokenBlacklist {
	private blacklistedTokens: Set<string> = new Set();

	/**
	 * Add token to blacklist
	 */
	add(token: string): void {
		this.blacklistedTokens.add(token);
		logger.debug(`Token blacklisted: ${token.substring(0, 20)}...`);
	}

	/**
	 * Check if token is blacklisted
	 */
	isBlacklisted(token: string): boolean {
		return this.blacklistedTokens.has(token);
	}

	/**
	 * Remove token from blacklist (for testing)
	 */
	remove(token: string): void {
		this.blacklistedTokens.delete(token);
		logger.debug(`Token removed from blacklist: ${token.substring(0, 20)}...`);
	}

	/**
	 * Clear all blacklisted tokens
	 */
	clear(): void {
		this.blacklistedTokens.clear();
		logger.debug('All tokens cleared from blacklist');
	}

	/**
	 * Get blacklist size (for monitoring)
	 */
	size(): number {
		return this.blacklistedTokens.size;
	}
}

const tokenBlacklist = new TokenBlacklist();

export default tokenBlacklist;
