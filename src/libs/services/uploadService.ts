import cloudinary, { CLOUDINARY_FOLDER } from '@/libs/config/cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import fs from 'fs';
import logger from '@/libs/core/logger';

interface IUploadOptions {
	folder?: string;
	resourceType?: 'image' | 'video' | 'raw' | 'auto';
	transformation?: any[];
}

interface IUploadResult {
	url: string;
	secureUrl: string;
	publicId: string;
	format: string;
	width?: number;
	height?: number;
	bytes: number;
	thumbnailUrl?: string;
}

/**
 * Upload file to Cloudinary
 */
export const uploadToCloudinary = async (
	filePath: string,
	options: IUploadOptions = {}
): Promise<IUploadResult> => {
	const folder = options.folder || CLOUDINARY_FOLDER;
	const resourceType = options.resourceType || 'auto';

	try {
		const result: UploadApiResponse = await cloudinary.uploader.upload(filePath, {
			folder,
			resource_type: resourceType,
			transformation: options.transformation
		});

		// Generate thumbnail URL for images
		let thumbnailUrl: string | undefined;
		if (result.resource_type === 'image') {
			thumbnailUrl = cloudinary.url(result.public_id, {
				width: 200,
				height: 200,
				crop: 'fill',
				quality: 'auto',
				fetch_format: 'auto'
			});
		}

		return {
			url: result.url,
			secureUrl: result.secure_url,
			publicId: result.public_id,
			format: result.format,
			width: result.width,
			height: result.height,
			bytes: result.bytes,
			thumbnailUrl
		};
	} catch (error) {
		const err = error as UploadApiErrorResponse;
		throw new Error(`Cloudinary upload failed: ${err.message || 'Unknown error'}`);
	}
};

/**
 * Delete file from Cloudinary
 */
export const deleteFromCloudinary = async (publicId: string): Promise<boolean> => {
	try {
		const result = await cloudinary.uploader.destroy(publicId);
		return result.result === 'ok';
	} catch (error) {
		const err = error as any;
		throw new Error(`Cloudinary delete failed: ${err.message || 'Unknown error'}`);
	}
};

/**
 * Delete temporary file from local storage
 */
export const deleteTempFile = (filePath: string): void => {
	try {
		if (fs.existsSync(filePath)) {
			fs.unlinkSync(filePath);
		}
	} catch (error) {
		logger.error('Failed to delete temp file:', error);
	}
};

/**
 * Validate file type
 */
export const isValidFileType = (mimetype: string): boolean => {
	const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/jpg,image/png,image/gif,image/webp')
		.split(',')
		.map(type => type.trim());
	
	return allowedTypes.includes(mimetype);
};

/**
 * Validate file size
 */
export const isValidFileSize = (size: number): boolean => {
	const maxSize = parseInt(process.env.MAX_FILE_SIZE || '5242880'); // 5MB default
	return size <= maxSize;
};

/**
 * Get file extension from mimetype
 */
export const getFileExtension = (mimetype: string): string => {
	const mimeMap: Record<string, string> = {
		'image/jpeg': 'jpg',
		'image/jpg': 'jpg',
		'image/png': 'png',
		'image/gif': 'gif',
		'image/webp': 'webp'
	};
	return mimeMap[mimetype] || 'jpg';
};

export default {
	uploadToCloudinary,
	deleteFromCloudinary,
	deleteTempFile,
	isValidFileType,
	isValidFileSize,
	getFileExtension
};

