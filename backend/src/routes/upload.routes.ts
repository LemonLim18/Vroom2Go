import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/chat');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        // Create unique filename: timestamp-originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
        cb(null, `${uniqueSuffix}-${baseName}${ext}`);
    }
});

// File filter for images, PDFs, and videos
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'video/mp4',
        'video/webm',
        'video/quicktime',
        'video/x-msvideo'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images, videos, and PDFs are allowed.'));
    }
};

// Multer upload middleware
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 200 * 1024 * 1024 // 200MB limit for videos
    }
});

/**
 * @desc    Upload a file for chat attachments
 * @route   POST /api/upload/chat
 * @access  Protected
 */
router.post('/chat', protect, upload.single('file'), (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Build the URL path for the uploaded file
        const fileUrl = `/uploads/chat/${req.file.filename}`;
        
        res.json({
            success: true,
            url: fileUrl,
            filename: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        });
    } catch (error: any) {
        console.error('Upload error:', error);
        res.status(500).json({ message: error.message });
    }
});

/**
 * @desc    General file upload (for forum posts, etc.)
 * @route   POST /api/upload
 * @access  Protected
 */
router.post('/', protect, (req: Request, res: Response, next) => {
    upload.single('file')(req, res, (err: any) => {
        if (err) {
            console.error('Multer error:', err);
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ 
                    message: 'File too large. Maximum size is 200MB.' 
                });
            }
            if (err.message) {
                return res.status(400).json({ 
                    message: err.message 
                });
            }
            return res.status(400).json({ 
                message: 'File upload failed' 
            });
        }

        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            console.log('File uploaded successfully:', {
                filename: req.file.filename,
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size
            });

            // Build the URL path for the uploaded file
            const fileUrl = `/uploads/chat/${req.file.filename}`;
            
            res.json({
                success: true,
                url: fileUrl,
                filename: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size
            });
        } catch (error: any) {
            console.error('Upload error:', error);
            res.status(500).json({ message: error.message });
        }
    });
});

// Ensure reviews upload directory exists
const reviewsDir = path.join(__dirname, '../../uploads/reviews');
if (!fs.existsSync(reviewsDir)) {
    fs.mkdirSync(reviewsDir, { recursive: true });
}

// Configure storage for review images
const reviewStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, reviewsDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `review-${uniqueSuffix}${ext}`);
    }
});

const reviewUpload = multer({
    storage: reviewStorage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit for review images
});

/**
 * @desc    Upload an image for reviews
 * @route   POST /api/upload/image
 * @access  Protected
 */
router.post('/image', protect, reviewUpload.single('image'), (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image uploaded' });
        }

        const fileUrl = `/uploads/reviews/${req.file.filename}`;
        
        res.json({
            success: true,
            url: fileUrl,
            filename: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        });
    } catch (error: any) {
        console.error('Image upload error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Error handling middleware for multer errors
router.use((error: any, _req: Request, res: Response, next: Function) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
        }
        return res.status(400).json({ message: error.message });
    }
    if (error) {
        return res.status(400).json({ message: error.message });
    }
    next();
});

export default router;
