import postgresConnection from '@/libs/config/postgresConnection';
import { TRequestFunction, InvalidParameterException, NotFoundException, ForbiddenException } from '@/libs/core';
import { TListMediaQueryValidation } from './media.request';
import uploadService from '@/libs/services/uploadService';
import { CLOUDINARY_FOLDER } from '@/libs/config/cloudinary';

/**
 * POST /media/upload - Upload file to Cloudinary
 */
const uploadMedia: TRequestFunction = async (req) => {
	const userId = req.userId;
	const file = req.file;

	if (!userId) {
		throw new InvalidParameterException('User authentication required');
	}

	if (!file) {
		throw new InvalidParameterException('No file uploaded');
	}

	// Validate file type
	if (!uploadService.isValidFileType(file.mimetype)) {
		uploadService.deleteTempFile(file.path);
		throw new InvalidParameterException(
			`Invalid file type. Allowed types: ${process.env.ALLOWED_FILE_TYPES || 'image/jpeg, image/png, image/gif, image/webp'}`
		);
	}

	// Validate file size
	if (!uploadService.isValidFileSize(file.size)) {
		uploadService.deleteTempFile(file.path);
		const maxSizeMB = (parseInt(process.env.MAX_FILE_SIZE || '5242880') / 1024 / 1024).toFixed(2);
		throw new InvalidParameterException(`File size exceeds ${maxSizeMB}MB limit`);
	}

	try {
		// Get folder from body or use default
		const folder = req.body.folder || 'uploads';
		const altText = req.body.alt || '';
		const caption = req.body.caption || '';

		// Upload to Cloudinary
		const cloudinaryResult = await uploadService.uploadToCloudinary(file.path, {
			folder: `${CLOUDINARY_FOLDER}/${folder}`,
			resourceType: 'image'
		});

		// Save to database
		const media = await postgresConnection.queryOne<Entity.IMedia>(`
			INSERT INTO media (
				file_name,
				file_size,
				file_type,
				mime_type,
				url,
				secure_url,
				thumbnail_url,
				public_id,
				width,
				height,
				format,
				folder,
				alt_text,
				caption,
				uploaded_by
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
			RETURNING *
		`, [
			file.originalname,
			file.size,
			file.mimetype.split('/')[0], // image, video, etc
			file.mimetype,
			cloudinaryResult.url,
			cloudinaryResult.secureUrl,
			cloudinaryResult.thumbnailUrl || null,
			cloudinaryResult.publicId,
			cloudinaryResult.width || null,
			cloudinaryResult.height || null,
			cloudinaryResult.format,
			folder,
			altText,
			caption,
			userId
		]);

		// Delete temporary file
		uploadService.deleteTempFile(file.path);

		// Get uploader info
		const uploader = await postgresConnection.queryOne<Entity.IUser>(
			'SELECT id, name, email FROM users WHERE id = $1',
			[userId]
		);

		const result = {
			...media,
			uploader
		};

		return {
			message: 'File uploaded successfully',
			result
		};
	} catch (error: any) {
		// Cleanup temp file on error
		uploadService.deleteTempFile(file.path);
		throw error;
	}
};

/**
 * GET /media - List media files
 */
const listMedia: TRequestFunction = async (req) => {
	const query = req.query as unknown as TListMediaQueryValidation;
	
	const page = Number(query.page) || 1;
	const limit = Math.min(Number(query.limit) || 20, 100);
	const offset = (page - 1) * limit;

	// Build WHERE conditions
	const conditions: string[] = [];
	const params: any[] = [];
	let paramIndex = 1;

	if (query.type) {
		conditions.push(`m.file_type = $${paramIndex}`);
		params.push(query.type);
		paramIndex++;
	}

	if (query.folder) {
		conditions.push(`m.folder = $${paramIndex}`);
		params.push(query.folder);
		paramIndex++;
	}

	if (query.search) {
		conditions.push(`(
			m.file_name ILIKE $${paramIndex} OR 
			m.alt_text ILIKE $${paramIndex}
		)`);
		params.push(`%${query.search}%`);
		paramIndex++;
	}

	const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

	// Build ORDER BY
	const sortBy = query.sortBy || 'created_at';
	const sortOrder = query.sortOrder || 'desc';
	const validSortColumns = ['created_at', 'file_size', 'file_name'];
	const orderColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
	const orderClause = `ORDER BY m.${orderColumn} ${sortOrder.toUpperCase()}`;

	// Get total count
	const countResult = await postgresConnection.queryOne<{ count: string }>(`
		SELECT COUNT(*) as count
		FROM media m
		${whereClause}
	`, params);

	const total = parseInt(countResult?.count || '0');
	const totalPages = Math.ceil(total / limit);

	// Get media files with uploader info
	const media = await postgresConnection.query<Entity.IMedia>(`
		SELECT 
			m.*,
			json_build_object(
				'id', u.id,
				'name', u.name,
				'email', u.email
			) as uploader
		FROM media m
		LEFT JOIN users u ON m.uploaded_by = u.id
		${whereClause}
		${orderClause}
		LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
	`, [...params, limit, offset]);

	const meta: Entity.IPaginationMeta = {
		page,
		limit,
		total,
		totalPages,
		hasNextPage: page < totalPages,
		hasPrevPage: page > 1
	};

	return {
		message: 'Media files retrieved successfully',
		result: media,
		meta
	};
};

/**
 * GET /media/:id - Get single media file
 */
const getMedia: TRequestFunction = async (req) => {
	const { id } = req.params;

	if (!id) {
		throw new InvalidParameterException('Media ID is required');
	}

	const media = await postgresConnection.queryOne<Entity.IMedia>(`
		SELECT 
			m.*,
			json_build_object(
				'id', u.id,
				'name', u.name,
				'email', u.email
			) as uploader
		FROM media m
		LEFT JOIN users u ON m.uploaded_by = u.id
		WHERE m.id = $1
	`, [id]);

	if (!media) {
		throw new NotFoundException('Media file not found');
	}

	return {
		message: 'Media file retrieved successfully',
		result: media
	};
};

/**
 * DELETE /media/:id - Delete media file
 */
const deleteMedia: TRequestFunction = async (req) => {
	const { id } = req.params;
	const userId = req.userId;
	const userRole = req.userData?.role;

	if (!id) {
		throw new InvalidParameterException('Media ID is required');
	}

	// Get media info
	const media = await postgresConnection.queryOne<Entity.IMedia>(
		'SELECT * FROM media WHERE id = $1 LIMIT 1',
		[id]
	);

	if (!media) {
		throw new NotFoundException('Media file not found');
	}

	// Authorization: Only uploader or ADMIN can delete
	if (media.uploaded_by !== userId && userRole !== 'ADMIN') {
		throw new ForbiddenException('You do not have permission to delete this media file');
	}

	try {
		// Delete from Cloudinary
		if (media.public_id) {
			await uploadService.deleteFromCloudinary(media.public_id);
		}

		// Delete from database
		await postgresConnection.query('DELETE FROM media WHERE id = $1', [id]);

		return {
			message: 'Media file deleted successfully',
			result: null
		};
	} catch (error: any) {
		throw new Error(`Failed to delete media: ${error.message}`);
	}
};

export default {
	uploadMedia,
	listMedia,
	getMedia,
	deleteMedia
};

