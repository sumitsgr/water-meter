import express from 'express';
import { getAllAlarms, resolveAlarm } from '../controllers/alarm.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getAllAlarms);
router.patch('/:id/resolve', authenticate, resolveAlarm);

export default router;