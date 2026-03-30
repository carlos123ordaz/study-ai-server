import { Router } from 'express';
import passport from 'passport';
import { googleCallback, getMe, logout, refreshToken } from '../controllers/authController';
import { requireAuth } from '../middlewares/auth';
import { authLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Initiate Google OAuth flow
router.get(
  '/google',
  authLimiter,
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

// Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/api/auth/google/failure', session: false }),
  googleCallback
);

router.get('/google/failure', (_req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  res.redirect(`${clientUrl}/login?error=google_auth_failed`);
});

// Get current user (protected)
router.get('/me', requireAuth, getMe);

// Refresh token (protected)
router.post('/refresh', requireAuth, refreshToken);

// Logout
router.post('/logout', requireAuth, logout);

export default router;
