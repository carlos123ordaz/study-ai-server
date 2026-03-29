"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = sendSuccess;
exports.sendCreated = sendCreated;
exports.sendError = sendError;
exports.sendNotFound = sendNotFound;
exports.sendUnauthorized = sendUnauthorized;
exports.sendForbidden = sendForbidden;
exports.sendBadRequest = sendBadRequest;
function sendSuccess(res, data, message, statusCode = 200, meta) {
    const response = { success: true, data, message, meta };
    return res.status(statusCode).json(response);
}
function sendCreated(res, data, message) {
    return sendSuccess(res, data, message, 201);
}
function sendError(res, error, statusCode = 500, data) {
    const response = { success: false, error, data };
    return res.status(statusCode).json(response);
}
function sendNotFound(res, resource = 'Resource') {
    return sendError(res, `${resource} not found`, 404);
}
function sendUnauthorized(res, message = 'Unauthorized') {
    return sendError(res, message, 401);
}
function sendForbidden(res, message = 'Forbidden') {
    return sendError(res, message, 403);
}
function sendBadRequest(res, message) {
    return sendError(res, message, 400);
}
//# sourceMappingURL=apiResponse.js.map