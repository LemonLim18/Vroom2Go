import { Router } from 'express';
import { getMyVehicles, addVehicle, getVehicleById, updateVehicle, deleteVehicle } from '../controllers/vehicle.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/', getMyVehicles);
router.post('/', addVehicle);
router.get('/:id', getVehicleById);
router.put('/:id', updateVehicle);
router.delete('/:id', deleteVehicle);

export default router;
