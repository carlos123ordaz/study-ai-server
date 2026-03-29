import { PaymentProvider, CreatePaymentInput, CreatePaymentResult, ConfirmPaymentResult } from './paymentProvider';
/**
 * Mock payment provider for development/demo.
 * Instantly completes all payments.
 */
export declare class MockPaymentProvider implements PaymentProvider {
    readonly name = "mock";
    createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
    confirmPayment(externalPaymentId: string): Promise<ConfirmPaymentResult>;
    handleWebhook(payload: unknown): Promise<ConfirmPaymentResult>;
}
//# sourceMappingURL=mockProvider.d.ts.map