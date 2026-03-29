export interface CreatePaymentInput {
    userId: string;
    creditsAmount: number;
    priceUsd: number;
    currency?: string;
    returnUrl?: string;
    cancelUrl?: string;
    metadata?: Record<string, unknown>;
}
export interface CreatePaymentResult {
    externalPaymentId: string;
    checkoutUrl?: string;
    status: 'pending' | 'completed';
    providerData?: Record<string, unknown>;
}
export interface ConfirmPaymentResult {
    status: 'completed' | 'failed' | 'pending' | 'cancelled';
    externalPaymentId: string;
    providerData?: Record<string, unknown>;
}
export interface PaymentProvider {
    readonly name: string;
    createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
    confirmPayment(externalPaymentId: string): Promise<ConfirmPaymentResult>;
    handleWebhook(payload: unknown, signature?: string): Promise<ConfirmPaymentResult>;
}
//# sourceMappingURL=paymentProvider.d.ts.map