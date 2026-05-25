import express from 'express';
import { login, getProfile,getMe } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.get('/me', authenticate, getMe);  
router.get('/profile', authenticate, getProfile);

export default router;