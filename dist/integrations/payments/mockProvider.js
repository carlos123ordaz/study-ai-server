"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockPaymentProvider = void 0;
const uuid_1 = require("uuid");
const logger_1 = require("../../utils/logger");
/**
 * Mock payment provider for development/demo.
 * Instantly completes all payments.
 */
class MockPaymentProvider {
    constructor() {
        this.name = 'mock';
    }
    async createPayment(input) {
        const externalPaymentId = `mock_${(0, uuid_1.v4)()}`;
        logger_1.logger.info(`[MockProvider] Creating payment for ${input.creditsAmount} credits ($${input.priceUsd})`);
        return {
            externalPaymentId,
            checkoutUrl: `/credits/mock-checkout?paymentId=${externalPaymentId}`,
            status: 'pending',
            providerData: {
                mockProvider: true,
                createdAt: new Date().toISOString(),
                input,
            },
        };
    }
    async confirmPayment(externalPaymentId) {
        logger_1.logger.info(`[MockProvider] Confirming payment: ${externalPaymentId}`);
        // Mock always succeeds
        return {
            status: 'completed',
            externalPaymentId,
            providerData: {
                mockProvider: true,
                confirmedAt: new Date().toISOString(),
            },
        };
    }
    async handleWebhook(payload) {
        const data = payload;
        return this.confirmPayment(data.externalPaymentId ?? '');
    }
}
exports.MockPaymentProvider = MockPaymentProvider;
//# sourceMappingURL=mockProvider.js.map