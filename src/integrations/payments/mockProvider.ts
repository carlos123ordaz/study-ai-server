import { v4 as uuidv4 } from 'uuid';
import {
  PaymentProvider,
  CreatePaymentInput,
  CreatePaymentResult,
  ConfirmPaymentResult,
} from './paymentProvider';
import { logger } from '../../utils/logger';

/**
 * Mock payment provider for development/demo.
 * Instantly completes all payments.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'mock';

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const externalPaymentId = `mock_${uuidv4()}`;

    logger.info(
      `[MockProvider] Creating payment for ${input.creditsAmount} credits ($${input.priceUsd})`
    );

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

  async confirmPayment(externalPaymentId: string, _transactionData?: Record<string, string>): Promise<ConfirmPaymentResult> {
    logger.info(`[MockProvider] Confirming payment: ${externalPaymentId}`);

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

  async handleWebhook(payload: unknown): Promise<ConfirmPaymentResult> {
    const data = payload as { externalPaymentId?: string };
    return this.confirmPayment(data.externalPaymentId ?? '');
  }
}
