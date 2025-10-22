import { Router } from 'express';
import { requestHandler, requestValidator } from '@/libs/core';
import authorizationMiddleware from '@/libs/middlewares/authorization.middleware';
import upload from '@/libs/config/multer';
import controller from './media.controller';
import request from './media.request';

const router = Router();

/**
 * POST /media/upload
 * @tags Media
 * @security BearerAuth
 * @summary Upload file to Cloudinary
 * @description Upload image file to Cloudinary. Supports JPEG, PNG, GIF, and WebP. Max file size: 5MB.
 *
 * @param {file} file.form.required - File to upload (form-data)
 * @param {string} folder.form - Organization folder (e.g., 'posts', 'avatars')
 * @param {string} alt.form - Alt text for accessibility
 * @param {string} caption.form - Image caption
 *
 * @return {object} 200 - File uploaded successfully
 * @return {object} 400 - Validation error or invalid file
 * @return {object} 401 - Unauthorized
 *
 * @example response - 200 - Success response
 * {
 *   "message": "File uploaded successfully",
 *   "result": {
 *     "id": "uuid",
 *     "fileName": "my-image.jpg",
 *     "fileSize": 245678,
 *     "fileType": "image",
 *     "mimeType": "image/jpeg",
 *     "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234/ai-cms/posts/abc.jpg",
 *     "secureUrl": "https://res.cloudinary.com/...",
 *     "thumbnailUrl": "https://res.cloudinary.com/.../c_fill,h_200,w_200/abc.jpg",
 *     "publicId": "ai-cms/posts/abc",
 *     "width": 1920,
 *     "height": 1080,
 *     "format": "jpg",
 *     "folder": "posts",
 *     "altText": "My image description",
 *     "caption": "Image caption",
 *     "uploader": {
 *       "id": "uuid",
 *       "name": "John Doe",
 *       "email": "john@example.com"
 *     },
 *     "createdAt": "2025-10-22T10:30:00Z"
 *   }
 * }
 */
router.post(
	'/media/upload',
	authorizationMiddleware,
	upload.single('file'),
	requestHandler(controller.uploadMedia)
);

/**
 * GET /media
 * @tags Media
 * @summary List media files
 * @description Get paginated list of uploaded media files with optional filtering
 *
 * @param {number} page.query - Page number (default: 1)
 * @param {number} limit.query - Items per page (default: 20, max: 100)
 * @param {string} type.query - Filter by file type (image, video, document)
 * @param {string} folder.query - Filter by folder
 * @param {string} search.query - Search in filename and alt text
 * @param {string} sortBy.query.enum:created_at,file_size,file_name - Sort field (default: created_at)
 * @param {string} sortOrder.query.enum:asc,desc - Sort order (default: desc)
 *
 * @return {object} 200 - Success response with media array
 *
 * @example response - 200 - Success response
 * {
 *   "message": "Media files retrieved successfully",
 *   "result": [
 *     {
 *       "id": "uuid",
 *       "fileName": "image.jpg",
 *       "fileSize": 245678,
 *       "fileType": "image",
 *       "url": "https://res.cloudinary.com/...",
 *       "thumbnailUrl": "https://...",
 *       "width": 1920,
 *       "height": 1080,
 *       "format": "jpg",
 *       "folder": "posts",
 *       "uploader": {
 *         "id": "uuid",
 *         "name": "John Doe",
 *         "email": "john@example.com"
 *       },
 *       "createdAt": "2025-10-22T10:30:00Z"
 *     }
 *   ],
 *   "meta": {
 *     "page": 1,
 *     "limit": 20,
 *     "total": 45,
 *     "totalPages": 3,
 *     "hasNextPage": true,
 *     "hasPrevPage": false
 *   }
 * }
 */
router.get(
	'/media',
	authorizationMiddleware,
	requestValidator({
		requestType: 'query',
		type: request.listMediaQueryValidation
	}),
	requestHandler(controller.listMedia)
);

/**
 * GET /media/:id
 * @tags Media
 * @summary Get single media file
 * @description Retrieve detailed information about a specific media file
 *
 * @param {string} id.path.required - Media ID (UUID)
 *
 * @return {object} 200 - Success response with media details
 * @return {object} 404 - Media not found
 *
 * @example response - 200 - Success response
 * {
 *   "message": "Media file retrieved successfully",
 *   "result": {
 *     "id": "uuid",
 *     "fileName": "my-image.jpg",
 *     "url": "https://res.cloudinary.com/...",
 *     "thumbnailUrl": "https://...",
 *     "uploader": {
 *       "id": "uuid",
 *       "name": "John Doe"
 *     }
 *   }
 * }
 */
router.get(
	'/media/:id',
	authorizationMiddleware,
	requestHandler(controller.getMedia)
);

/**
 * DELETE /media/:id
 * @tags Media
 * @security BearerAuth
 * @summary Delete media file
 * @description Delete media file from Cloudinary and database. Only uploader or admin can delete.
 *
 * @param {string} id.path.required - Media ID (UUID)
 *
 * @return {object} 200 - Media deleted successfully
 * @return {object} 401 - Unauthorized
 * @return {object} 403 - Forbidden (only uploader or admin)
 * @return {object} 404 - Media not found
 *
 * @example response - 200 - Success response
 * {
 *   "message": "Media file deleted successfully",
 *   "result": null
 * }
 */
router.delete(
	'/media/:id',
	authorizationMiddleware,
	requestHandler(controller.deleteMedia)
);

export default router;

