import express from 'express';
import { getUsers, getUserById, updateUserProfile, deleteUser } from '../controllers/user.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = express.Router();

router.route('/')
  .get(protect, authorize('ADMIN'), getUsers);

router.route('/profile')
  .put(protect, updateUserProfile);

router.route('/:id')
  .get(protect, getUserById)
  .delete(protect, authorize('ADMIN'), deleteUser);

export default router;
