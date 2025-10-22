import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'storage', 'temp', 'uploads');
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage (temporary local storage before uploading to Cloudinary)
const storage = multer.diskStorage({
	destination: (_req, _file, cb) => {
		cb(null, uploadDir);
	},
	filename: (_req, file, cb) => {
		// Generate unique filename
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
		const ext = path.extname(file.originalname);
		cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
	}
});

// File filter for validation
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
	// Allowed file types
	const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
	
	if (allowedMimes.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
	}
};

// Multer configuration
const upload = multer({
	storage,
	fileFilter,
	limits: {
		fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880') // 5MB default
	}
});

export default upload;

