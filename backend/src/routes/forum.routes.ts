import { Router } from 'express';
import { getPosts, createPost, toggleLike, addComment, updatePost, deletePost } from '../controllers/forum.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.get('/', protect, getPosts);
router.post('/', protect, createPost);
router.post('/:id/like', protect, toggleLike);
router.post('/:id/comments', protect, addComment);
router.put('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);

export default router;
