"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCreditPackages = getCreditPackages;
exports.initiatePayment = initiatePayment;
exports.confirmPayment = confirmPayment;
exports.getUserPayments = getUserPayments;
const Payment_1 = require("../models/Payment");
const mockProvider_1 = require("../integrations/payments/mockProvider");
const mercadoPagoProvider_1 = require("../integrations/payments/mercadoPagoProvider");
const paypalProvider_1 = require("../integrations/payments/paypalProvider");
const creditService_1 = require("./creditService");
const env_1 = require("../config/env");
const errorHandler_1 = require("../middlewares/errorHandler");
const logger_1 = require("../utils/logger");
let provider;
function getProvider() {
    if (!provider) {
        switch (env_1.env.payment.provider) {
            case 'mercadopago':
                provider = new mercadoPagoProvider_1.MercadoPagoProvider();
                break;
            case 'paypal':
                provider = new paypalProvider_1.PayPalProvider();
                break;
            default:
                provider = new mockProvider_1.MockPaymentProvider();
        }
        logger_1.logger.info(`Payment provider: ${provider.name}`);
    }
    return provider;
}
function getCreditPackages() {
    return Payment_1.CREDIT_PACKAGES;
}
async function initiatePayment(userId, packageIndex, returnUrl, cancelUrl) {
    const packages = Payment_1.CREDIT_PACKAGES;
    if (packageIndex < 0 || packageIndex >= packages.length) {
        throw new errorHandler_1.BadRequestError('Invalid credit package');
    }
    const pkg = packages[packageIndex];
    const p = getProvider();
    // Create payment record
    const payment = await Payment_1.Payment.create({
        userId,
        provider: p.name,
        status: 'pending',
        creditsAmount: pkg.credits,
        priceUsd: pkg.priceUsd,
        currency: 'USD',
    });
    try {
        const result = await p.createPayment({
            userId,
            creditsAmount: pkg.credits,
            priceUsd: pkg.priceUsd,
            returnUrl,
            cancelUrl,
            metadata: { paymentId: payment._id.toString() },
        });
        payment.externalPaymentId = result.externalPaymentId;
        payment.providerData = result.providerData;
        await payment.save();
        return {
            payment,
            checkoutUrl: result.checkoutUrl,
            package: pkg,
        };
    }
    catch (error) {
        payment.status = 'failed';
        payment.errorMessage = error.message;
        await payment.save();
        throw error;
    }
}
async function confirmPayment(paymentId, userId) {
    const payment = await Payment_1.Payment.findById(paymentId);
    if (!payment)
        throw new errorHandler_1.NotFoundError('Payment');
    if (payment.userId.toString() !== userId)
        throw new errorHandler_1.BadRequestError('Payment not found');
    if (payment.status === 'completed')
        return payment;
    const p = getProvider();
    const result = await p.confirmPayment(payment.externalPaymentId ?? '');
    if (result.status === 'completed') {
        const transaction = await (0, creditService_1.addCredits)(userId, payment.creditsAmount, 'payment_recharge', `Purchased ${payment.creditsAmount} credits via ${p.name}`, payment._id, 'Payment');
        payment.status = 'completed';
        payment.completedAt = new Date();
        payment.providerData = { ...payment.providerData, confirmation: result.providerData };
        await payment.save();
        logger_1.logger.info(`Payment completed: ${paymentId}, credits=${payment.creditsAmount}, user=${userId}`);
    }
    else if (result.status === 'failed') {
        payment.status = 'failed';
        payment.providerData = { ...payment.providerData, confirmation: result.providerData };
        await payment.save();
    }
    return payment;
}
async function getUserPayments(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
        Payment_1.Payment.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Payment_1.Payment.countDocuments({ userId }),
    ]);
    return {
        payments,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
}
//# sourceMappingURL=paymentService.js.map