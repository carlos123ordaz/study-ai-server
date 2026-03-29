"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayPalProvider = void 0;
const env_1 = require("../../config/env");
const logger_1 = require("../../utils/logger");
/**
 * PayPal payment provider adapter.
 *
 * To activate:
 * 1. Set PAYMENT_PROVIDER=paypal in .env
 * 2. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET
 * 3. Install: npm install @paypal/checkout-server-sdk
 * 4. Uncomment implementation below
 *
 * Docs: https://developer.paypal.com/docs/api/orders/v2/
 */
class PayPalProvider {
    constructor() {
        this.name = 'paypal';
        if (!env_1.env.payment.paypal.clientId || !env_1.env.payment.paypal.clientSecret) {
            throw new Error('PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are required');
        }
        this.baseUrl =
            env_1.env.payment.paypal.mode === 'live'
                ? 'https://api-m.paypal.com'
                : 'https://api-m.sandbox.paypal.com';
        logger_1.logger.info(`[PayPal] Provider initialized in ${env_1.env.payment.paypal.mode} mode`);
    }
    async createPayment(input) {
        // TODO: Implement PayPal Orders v2 API
        // const accessToken = await this.getAccessToken();
        // const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
        //   method: 'POST',
        //   headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     intent: 'CAPTURE',
        //     purchase_units: [{ amount: { currency_code: 'USD', value: input.priceUsd.toFixed(2) } }],
        //     application_context: { return_url: input.returnUrl, cancel_url: input.cancelUrl },
        //   }),
        // });
        throw new Error('PayPal provider not yet implemented. Set PAYMENT_PROVIDER=mock for development.');
    }
    async confirmPayment(externalPaymentId) {
        // TODO: Capture PayPal order
        throw new Error('PayPal provider not yet implemented.');
    }
    async handleWebhook(payload, signature) {
        // TODO: Verify PayPal webhook and extract event data
        throw new Error('PayPal webhook handler not yet implemented.');
    }
    async getAccessToken() {
        const credentials = Buffer.from(`${env_1.env.payment.paypal.clientId}:${env_1.env.payment.paypal.clientSecret}`).toString('base64');
        const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'grant_type=client_credentials',
        });
        const data = await response.json();
        return data.access_token;
    }
}
exports.PayPalProvider = PayPalProvider;
//# sourceMappingURL=paypalProvider.js.map