"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.requireAuth = requireAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const User_1 = require("../models/User");
const apiResponse_1 = require("../utils/apiResponse");
function generateToken(user) {
    const payload = {
        userId: user._id.toString(),
        email: user.email,
    };
    return jsonwebtoken_1.default.sign(payload, env_1.env.jwtSecret, { expiresIn: env_1.env.jwtExpiresIn });
}
async function requireAuth(req, res, next) {
    try {
        const token = extractToken(req);
        if (!token) {
            (0, apiResponse_1.sendUnauthorized)(res, 'Authentication required');
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.jwtSecret);
        const user = await User_1.User.findById(decoded.userId);
        if (!user || !user.isActive) {
            (0, apiResponse_1.sendUnauthorized)(res, 'User not found or inactive');
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            (0, apiResponse_1.sendUnauthorized)(res, 'Invalid token');
        }
        else if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            (0, apiResponse_1.sendUnauthorized)(res, 'Token expired');
        }
        else {
            (0, apiResponse_1.sendUnauthorized)(res, 'Authentication failed');
        }
    }
}
function extractToken(req) {
    // 1. Authorization header: Bearer <token>
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.slice(7);
    }
    // 2. Cookie
    if (req.cookies?.token) {
        return req.cookies.token;
    }
    return null;
}
//# sourceMappingURL=auth.js.map