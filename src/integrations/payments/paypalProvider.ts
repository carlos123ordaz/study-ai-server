import {
  PaymentProvider,
  CreatePaymentInput,
  CreatePaymentResult,
  ConfirmPaymentResult,
} from './paymentProvider';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

interface PayPalOrder {
  id: string;
  status: string;
  links: Array<{ rel: string; href: string; method: string }>;
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{ id: string; status: string }>;
    };
  }>;
}

interface PayPalTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export class PayPalProvider implements PaymentProvider {
  readonly name = 'paypal';
  private baseUrl: string;

  constructor() {
    if (!env.payment.paypal.clientId || !env.payment.paypal.clientSecret) {
      throw new Error('PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are required');
    }
    this.baseUrl =
      env.payment.paypal.mode === 'live'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';
    logger.info(`[PayPal] Provider initialized in ${env.payment.paypal.mode} mode`);
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': input.metadata?.paymentId as string,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: input.metadata?.paymentId as string,
            description: `${input.creditsAmount} StudyAI Créditos`,
            amount: {
              currency_code: 'USD',
              value: input.priceUsd.toFixed(2),
            },
          },
        ],
        application_context: {
          return_url: input.returnUrl,
          cancel_url: input.cancelUrl,
          brand_name: 'StudyAI',
          user_action: 'PAY_NOW',
          landing_page: 'LOGIN',
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`PayPal createOrder failed: ${err}`);
    }

    const order = (await response.json()) as PayPalOrder;
    const approvalUrl = order.links.find((l) => l.rel === 'approve')?.href;
    if (!approvalUrl) throw new Error('PayPal: no approval URL in response');

    logger.info(`[PayPal] Order created: ${order.id}`);

    return {
      externalPaymentId: order.id,
      checkoutUrl: approvalUrl,
      status: 'pending',
      providerData: { orderId: order.id },
    };
  }

  async confirmPayment(
    externalPaymentId: string,
    _transactionData?: Record<string, string>
  ): Promise<ConfirmPaymentResult> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(
      `${this.baseUrl}/v2/checkout/orders/${externalPaymentId}/capture`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const err = await response.text();
      logger.error(`[PayPal] Capture failed for order ${externalPaymentId}: ${err}`);
      // 422 means order already captured or invalid state
      if (response.status === 422) {
        const order = await this.getOrder(externalPaymentId, accessToken);
        return {
          status: order.status === 'COMPLETED' ? 'completed' : 'failed',
          externalPaymentId,
          providerData: { paypalStatus: order.status },
        };
      }
      return { status: 'failed', externalPaymentId };
    }

    const order = (await response.json()) as PayPalOrder;
    const captureStatus = order.purchase_units?.[0]?.payments?.captures?.[0]?.status;
    const isCompleted = order.status === 'COMPLETED' || captureStatus === 'COMPLETED';

    logger.info(`[PayPal] Order ${externalPaymentId} captured: ${order.status}`);

    return {
      status: isCompleted ? 'completed' : 'failed',
      externalPaymentId,
      providerData: { paypalStatus: order.status, captureStatus },
    };
  }

  async handleWebhook(payload: unknown): Promise<ConfirmPaymentResult> {
    const data = payload as { resource?: { id?: string }; event_type?: string };

    if (!data.resource?.id) {
      throw new Error('Invalid PayPal webhook payload');
    }

    logger.info(`[PayPal] Webhook received: ${data.event_type}, resource: ${data.resource.id}`);
    return this.confirmPayment(data.resource.id);
  }

  private async getOrder(orderId: string, accessToken: string): Promise<PayPalOrder> {
    const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.json() as Promise<PayPalOrder>;
  }

  private async getAccessToken(): Promise<string> {
    const credentials = Buffer.from(
      `${env.payment.paypal.clientId}:${env.payment.paypal.clientSecret}`
    ).toString('base64');

    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error('Failed to get PayPal access token');
    }

    const data = (await response.json()) as PayPalTokenResponse;
    return data.access_token;
  }
}
