import express from 'express';
import { getAllUsers,deleteUser,createOrUpdateUser} from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET /api/users
router.get('/', authenticate, getAllUsers);
router.delete("/:id",authenticate, deleteUser);
router.post("/save", authenticate,createOrUpdateUser);

export default router;