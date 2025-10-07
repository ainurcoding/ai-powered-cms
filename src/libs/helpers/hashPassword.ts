import bcrypt from 'bcryptjs';

/**
 * Hash password menggunakan bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
	const salt = await bcrypt.genSalt(10);
	return await bcrypt.hash(password, salt);
}

/**
 * Verify password dengan hash
 * @param password - Plain text password
 * @param hash - Hashed password
 * @returns boolean
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
	return await bcrypt.compare(password, hash);
}

// CLI tool untuk generate hash password
// Usage: tsx src/libs/helpers/hashPassword.ts <password>
if (require.main === module) {
	const password = process.argv[2];
	
	if (!password) {
		// eslint-disable-next-line no-console
		console.log('Usage: tsx src/libs/helpers/hashPassword.ts <password>');
		process.exit(1);
	}

	hashPassword(password).then((hash) => {
		// eslint-disable-next-line no-console
		console.log('\nPassword:', password);
		// eslint-disable-next-line no-console
		console.log('Hashed:', hash);
		// eslint-disable-next-line no-console
		console.log('\nGunakan hash ini untuk field password di database\n');
	}).catch((error) => {
		// eslint-disable-next-line no-console
		console.error('Error:', error);
		process.exit(1);
	});
}

