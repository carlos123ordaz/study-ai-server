"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPackages = getPackages;
exports.createPayment = createPayment;
exports.confirmPaymentHandler = confirmPaymentHandler;
exports.listPayments = listPayments;
exports.paymentWebhook = paymentWebhook;
const paymentService_1 = require("../services/paymentService");
const apiResponse_1 = require("../utils/apiResponse");
async function getPackages(_req, res) {
    const packages = (0, paymentService_1.getCreditPackages)();
    (0, apiResponse_1.sendSuccess)(res, packages);
}
async function createPayment(req, res) {
    const user = req.user;
    const { packageIndex, returnUrl, cancelUrl } = req.body;
    const result = await (0, paymentService_1.initiatePayment)(user._id.toString(), parseInt(packageIndex), returnUrl, cancelUrl);
    (0, apiResponse_1.sendCreated)(res, result, 'Payment initiated');
}
async function confirmPaymentHandler(req, res) {
    const user = req.user;
    const { id } = req.params;
    const payment = await (0, paymentService_1.confirmPayment)(id, user._id.toString());
    (0, apiResponse_1.sendSuccess)(res, payment, 'Payment confirmed');
}
async function listPayments(req, res) {
    const user = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const result = await (0, paymentService_1.getUserPayments)(user._id.toString(), page, limit);
    (0, apiResponse_1.sendSuccess)(res, result.payments, undefined, 200, { pagination: result.pagination });
}
// Webhook endpoint (no auth required)
async function paymentWebhook(req, res) {
    // In production: validate webhook signature
    // For now just acknowledge
    res.status(200).json({ received: true });
}
//# sourceMappingURL=paymentController.js.map