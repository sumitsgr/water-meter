import express from 'express';
import {
  getAllDevices,
  getDeviceById,
  getDeviceConsumption,
  getDeviceAlarms
} from '../controllers/device.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getAllDevices);
router.get('/:device_id', authenticate, getDeviceById);
router.get('/:device_id/consumption', authenticate, getDeviceConsumption);
router.get('/:device_id/alarms', authenticate, getDeviceAlarms);

export default router;