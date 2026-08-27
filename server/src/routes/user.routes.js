import { Router } from 'express';
import { deleteUser, listUsers, updateUser } from '../controllers/user.controller.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireAdmin);
router.get('/', listUsers);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
