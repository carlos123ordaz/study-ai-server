"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsufficientCreditsError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = exports.NotFoundError = exports.AppError = void 0;
exports.errorHandler = errorHandler;
const logger_1 = require("../utils/logger");
const env_1 = require("../config/env");
class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404);
    }
}
exports.NotFoundError = NotFoundError;
class BadRequestError extends AppError {
    constructor(message) {
        super(message, 400);
    }
}
exports.BadRequestError = BadRequestError;
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = 'Access denied') {
        super(message, 403);
    }
}
exports.ForbiddenError = ForbiddenError;
class InsufficientCreditsError extends AppError {
    constructor(required, available) {
        super(`Insufficient credits. Required: ${required}, Available: ${available}`, 402);
    }
}
exports.InsufficientCreditsError = InsufficientCreditsError;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function errorHandler(err, req, res, _next) {
    if (err instanceof AppError) {
        if (!err.isOperational) {
            logger_1.logger.error('Non-operational error:', { error: err.message, stack: err.stack });
        }
        res.status(err.statusCode).json({
            success: false,
            error: err.message,
        });
        return;
    }
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        res.status(400).json({
            success: false,
            error: 'Validation error',
            data: err.message,
        });
        return;
    }
    // Mongoose duplicate key error
    if (err.code === '11000') {
        res.status(409).json({
            success: false,
            error: 'Duplicate entry',
        });
        return;
    }
    logger_1.logger.error('Unhandled error:', {
        error: err.message,
        stack: env_1.env.isDev ? err.stack : undefined,
        path: req.path,
        method: req.method,
    });
    res.status(500).json({
        success: false,
        error: env_1.env.isDev ? err.message : 'Internal server error',
    });
}
//# sourceMappingURL=errorHandler.js.map