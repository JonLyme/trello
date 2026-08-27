import { Router } from 'express';
import { getDashboardAnalytics } from '../controllers/analytics.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.get('/dashboard', requireAuth, getDashboardAnalytics);
export default router;
