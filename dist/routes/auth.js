"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middlewares/auth");
const rateLimiter_1 = require("../middlewares/rateLimiter");
const router = (0, express_1.Router)();
// Initiate Google OAuth flow
router.get('/google', rateLimiter_1.authLimiter, passport_1.default.authenticate('google', { scope: ['profile', 'email'], session: false }));
// Google OAuth callback
router.get('/google/callback', passport_1.default.authenticate('google', { failureRedirect: '/api/auth/google/failure', session: false }), authController_1.googleCallback);
router.get('/google/failure', (_req, res) => {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/login?error=google_auth_failed`);
});
// Get current user (protected)
router.get('/me', auth_1.requireAuth, authController_1.getMe);
// Refresh token (protected)
router.post('/refresh', auth_1.requireAuth, authController_1.refreshToken);
// Logout
router.post('/logout', auth_1.requireAuth, authController_1.logout);
exports.default = router;
//# sourceMappingURL=auth.js.map