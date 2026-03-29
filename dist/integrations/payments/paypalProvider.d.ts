import { PaymentProvider, CreatePaymentInput, CreatePaymentResult, ConfirmPaymentResult } from './paymentProvider';
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
export declare class PayPalProvider implements PaymentProvider {
    readonly name = "paypal";
    private baseUrl;
    constructor();
    createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
    confirmPayment(externalPaymentId: string): Promise<ConfirmPaymentResult>;
    handleWebhook(payload: unknown, signature?: string): Promise<ConfirmPaymentResult>;
    private getAccessToken;
}
//# sourceMappingURL=paypalProvider.d.ts.map