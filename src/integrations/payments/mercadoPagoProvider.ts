import {
  PaymentProvider,
  CreatePaymentInput,
  CreatePaymentResult,
  ConfirmPaymentResult,
} from './paymentProvider';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { MercadoPagoConfig, Preference, Payment as MPPayment } from 'mercadopago';

export class MercadoPagoProvider implements PaymentProvider {
  readonly name = 'mercadopago';
  private client: MercadoPagoConfig;

  constructor() {
    if (!env.payment.mercadopago.accessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN is required');
    }
    this.client = new MercadoPagoConfig({
      accessToken: env.payment.mercadopago.accessToken,
    });
    logger.info('[MercadoPago] Provider initialized');
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const preference = new Preference(this.client);
    const isSandbox = env.payment.mercadopago.accessToken.startsWith('TEST-');

    const response = await preference.create({
      body: {
        items: [
          {
            id: input.metadata?.paymentId as string,
            title: `${input.creditsAmount} StudyAI Créditos`,
            quantity: 1,
            unit_price: input.priceUsd,
            currency_id: 'USD',
          },
        ],
        back_urls: {
          success: input.returnUrl,
          failure: input.cancelUrl,
          pending: input.returnUrl,
        },
        // auto_return requires a public (non-localhost) URL; omit in local dev
        ...(input.returnUrl && !input.returnUrl.includes('localhost')
          ? { auto_return: 'approved' as const }
          : {}),
        external_reference: input.metadata?.paymentId as string,
      },
    });

    const checkoutUrl = isSandbox
      ? (response.sandbox_init_point ?? response.init_point!)
      : response.init_point!;

    logger.info(`[MercadoPago] Preference created: ${response.id}`);

    return {
      externalPaymentId: response.id!,
      checkoutUrl,
      status: 'pending',
      providerData: { preferenceId: response.id },
    };
  }

  async confirmPayment(
    externalPaymentId: string,
    transactionData?: Record<string, string>
  ): Promise<ConfirmPaymentResult> {
    const mpPaymentId = transactionData?.mpPaymentId;

    if (!mpPaymentId) {
      logger.warn('[MercadoPago] confirmPayment called without mpPaymentId — returning pending');
      return { status: 'pending', externalPaymentId };
    }

    const mpPay = new MPPayment(this.client);
    const payment = await mpPay.get({ id: Number(mpPaymentId) });

    const statusMap: Record<string, ConfirmPaymentResult['status']> = {
      approved: 'completed',
      rejected: 'failed',
      cancelled: 'cancelled',
      pending: 'pending',
      in_process: 'pending',
      in_mediation: 'pending',
      refunded: 'failed',
      charged_back: 'failed',
    };

    const status = statusMap[payment.status ?? ''] ?? 'pending';
    logger.info(`[MercadoPago] Payment ${mpPaymentId} status: ${payment.status} → ${status}`);

    return {
      status,
      externalPaymentId: mpPaymentId,
      providerData: { mpPaymentId, mpStatus: payment.status },
    };
  }

  async handleWebhook(payload: unknown): Promise<ConfirmPaymentResult> {
    const data = payload as { data?: { id?: string }; type?: string };

    if (data.type !== 'payment' || !data.data?.id) {
      throw new Error('Invalid MercadoPago webhook payload');
    }

    logger.info(`[MercadoPago] Webhook received for payment ${data.data.id}`);
    return this.confirmPayment('', { mpPaymentId: String(data.data.id) });
  }
}
