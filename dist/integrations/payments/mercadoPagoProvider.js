"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MercadoPagoProvider = void 0;
const env_1 = require("../../config/env");
const logger_1 = require("../../utils/logger");
/**
 * MercadoPago payment provider adapter.
 *
 * To activate:
 * 1. Set PAYMENT_PROVIDER=mercadopago in .env
 * 2. Set MERCADOPAGO_ACCESS_TOKEN and MERCADOPAGO_PUBLIC_KEY
 * 3. Install: npm install mercadopago
 * 4. Uncomment implementation below
 *
 * Docs: https://www.mercadopago.com.br/developers/en/docs
 */
class MercadoPagoProvider {
    constructor() {
        this.name = 'mercadopago';
        if (!env_1.env.payment.mercadopago.accessToken) {
            throw new Error('MERCADOPAGO_ACCESS_TOKEN is required');
        }
        logger_1.logger.info('[MercadoPago] Provider initialized');
    }
    async createPayment(input) {
        // TODO: Implement using MercadoPago Checkout Pro or Payments API
        // const { MercadoPagoConfig, Preference } = require('mercadopago');
        // const client = new MercadoPagoConfig({ accessToken: env.payment.mercadopago.accessToken });
        // const preference = new Preference(client);
        // const response = await preference.create({
        //   body: {
        //     items: [{ title: `${input.creditsAmount} StudyAI Credits`, quantity: 1, unit_price: input.priceUsd }],
        //     back_urls: { success: input.returnUrl, failure: input.cancelUrl },
        //     external_reference: input.metadata?.paymentId as string,
        //   }
        // });
        throw new Error('MercadoPago provider not yet implemented. Set PAYMENT_PROVIDER=mock for development.');
    }
    async confirmPayment(externalPaymentId) {
        // TODO: Query MercadoPago API for payment status
        throw new Error('MercadoPago provider not yet implemented.');
    }
    async handleWebhook(payload, signature) {
        // TODO: Validate webhook signature and extract payment data
        throw new Error('MercadoPago webhook handler not yet implemented.');
    }
}
exports.MercadoPagoProvider = MercadoPagoProvider;
//# sourceMappingURL=mercadoPagoProvider.js.map