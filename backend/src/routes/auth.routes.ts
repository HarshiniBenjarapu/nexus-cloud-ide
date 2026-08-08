import { Router } from 'express';
import { register, login, getMe, logout } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Protected routes
router.get('/me', protect, getMe);

export default router;
