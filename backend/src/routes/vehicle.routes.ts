import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getMyVehicles, addVehicle, getVehicleById, updateVehicle, deleteVehicle } from '../controllers/vehicle.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/vehicles');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `vehicle-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

router.use(protect);

router.get('/', getMyVehicles);
router.post('/', upload.single('image'), addVehicle);
router.get('/:id', getVehicleById);
router.put('/:id', upload.single('image'), updateVehicle);
router.delete('/:id', deleteVehicle);

export default router;
