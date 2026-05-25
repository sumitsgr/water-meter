import express from 'express';
import { getZoneStats, getDashboardSummary } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/summary', authenticate, getDashboardSummary);
router.get('/zones', authenticate, getZoneStats);

export default router;