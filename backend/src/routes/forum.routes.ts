import { Router } from 'express';
import { getPosts, createPost, toggleLike, addComment } from '../controllers/forum.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.get('/', protect, getPosts);
router.post('/', protect, createPost);
router.post('/:id/like', protect, toggleLike);
router.post('/:id/comments', protect, addComment);

export default router;
