import { PaymentProvider, CreatePaymentInput, CreatePaymentResult, ConfirmPaymentResult } from './paymentProvider';
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
export declare class MercadoPagoProvider implements PaymentProvider {
    readonly name = "mercadopago";
    constructor();
    createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
    confirmPayment(externalPaymentId: string): Promise<ConfirmPaymentResult>;
    handleWebhook(payload: unknown, signature?: string): Promise<ConfirmPaymentResult>;
}
//# sourceMappingURL=mercadoPagoProvider.d.ts.map