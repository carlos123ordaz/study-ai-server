"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleCallback = googleCallback;
exports.getMe = getMe;
exports.logout = logout;
exports.refreshToken = refreshToken;
const auth_1 = require("../middlewares/auth");
const apiResponse_1 = require("../utils/apiResponse");
const env_1 = require("../config/env");
function googleCallback(req, res) {
    const user = req.user;
    if (!user) {
        res.redirect(`${env_1.env.clientUrl}/login?error=auth_failed`);
        return;
    }
    const token = (0, auth_1.generateToken)(user);
    // Set httpOnly cookie
    res.cookie('token', token, {
        httpOnly: true,
        secure: env_1.env.isProd,
        sameSite: env_1.env.isProd ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    // Redirect to frontend with token in URL for SPA to pick up
    res.redirect(`${env_1.env.clientUrl}/auth/callback?token=${token}`);
}
function getMe(req, res) {
    const user = req.user;
    (0, apiResponse_1.sendSuccess)(res, {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        credits: user.credits,
        createdAt: user.createdAt,
    });
}
function logout(req, res) {
    res.clearCookie('token');
    (0, apiResponse_1.sendSuccess)(res, null, 'Logged out successfully');
}
function refreshToken(req, res) {
    const user = req.user;
    const token = (0, auth_1.generateToken)(user);
    res.cookie('token', token, {
        httpOnly: true,
        secure: env_1.env.isProd,
        sameSite: env_1.env.isProd ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    (0, apiResponse_1.sendSuccess)(res, { token }, 'Token refreshed');
}
//# sourceMappingURL=authController.js.map