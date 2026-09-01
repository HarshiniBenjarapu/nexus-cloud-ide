import { Router } from 'express';
import {
    register,
    login,
    getMe,
    logout,
    socialAuth,
    githubCallback,
    googleCallback,
    verifyEmail,
    forgotPassword,
    resetPassword,
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, } from '../validators/auth.validator';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/social', socialAuth);
router.post('/logout', logout);
router.get('/verify-email', verifyEmail);
router.post(
    '/forgot-password',
    validate(forgotPasswordSchema),
    forgotPassword
);
router.post(
    '/reset-password',
    validate(resetPasswordSchema),
    resetPassword
);
router.get('/github/callback', githubCallback);
router.get('/google/callback', googleCallback);
// Protected routes
router.get('/me', protect, getMe);

export default router;
