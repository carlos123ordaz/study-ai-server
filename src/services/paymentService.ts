import { Payment, CREDIT_PACKAGES } from '../models/Payment';
import { PaymentProvider } from '../integrations/payments/paymentProvider';
import { MockPaymentProvider } from '../integrations/payments/mockProvider';
import { MercadoPagoProvider } from '../integrations/payments/mercadoPagoProvider';
import { PayPalProvider } from '../integrations/payments/paypalProvider';
import { addCredits } from './creditService';
import { env } from '../config/env';
import { BadRequestError, NotFoundError } from '../middlewares/errorHandler';
import { logger } from '../utils/logger';

const providers = new Map<string, PaymentProvider>();

function getProvider(name?: string): PaymentProvider {
  const providerName = name ?? 'mock';

  if (!providers.has(providerName)) {
    let p: PaymentProvider;
    switch (providerName) {
      case 'mercadopago':
        p = new MercadoPagoProvider();
        break;
      case 'paypal':
        p = new PayPalProvider();
        break;
      default:
        p = new MockPaymentProvider();
    }
    providers.set(providerName, p);
    logger.info(`Payment provider initialized: ${p.name}`);
  }

  return providers.get(providerName)!;
}

export function getCreditPackages() {
  return CREDIT_PACKAGES;
}

export function getAvailableProviders(): string[] {
  const available: string[] = [];
  if (env.payment.mercadopago.accessToken && !env.payment.mercadopago.accessToken.startsWith('your_')) {
    available.push('mercadopago');
  }
  if (
    env.payment.paypal.clientId &&
    env.payment.paypal.clientSecret &&
    !env.payment.paypal.clientId.startsWith('your_')
  ) {
    available.push('paypal');
  }
  if (available.length === 0) {
    available.push('mock');
  }
  return available;
}

export async function initiatePayment(
  userId: string,
  packageIndex: number,
  returnUrl?: string,
  cancelUrl?: string,
  providerName?: string
) {
  const packages = CREDIT_PACKAGES;
  if (packageIndex < 0 || packageIndex >= packages.length) {
    throw new BadRequestError('Invalid credit package');
  }

  const pkg = packages[packageIndex];
  const available = getAvailableProviders();
  const selectedProvider = providerName && available.includes(providerName) ? providerName : available[0];
  const p = getProvider(selectedProvider);

  const payment = await Payment.create({
    userId,
    provider: p.name,
    status: 'pending',
    creditsAmount: pkg.credits,
    priceUsd: pkg.priceUsd,
    currency: 'USD',
  });

  const internalId = payment._id.toString();
  const baseReturn = returnUrl ?? `${env.clientUrl}/payment/success`;
  const baseCancel = cancelUrl ?? `${env.clientUrl}/payment/cancel`;
  const finalReturnUrl = `${baseReturn}?paymentId=${internalId}`;
  const finalCancelUrl = `${baseCancel}?paymentId=${internalId}&cancelled=1`;

  try {
    const result = await p.createPayment({
      userId,
      creditsAmount: pkg.credits,
      priceUsd: pkg.priceUsd,
      returnUrl: finalReturnUrl,
      cancelUrl: finalCancelUrl,
      metadata: { paymentId: internalId },
    });

    payment.externalPaymentId = result.externalPaymentId;
    payment.providerData = result.providerData;
    await payment.save();

    return {
      payment,
      checkoutUrl: result.checkoutUrl,
      package: pkg,
    };
  } catch (error) {
    payment.status = 'failed';
    payment.errorMessage = (error as Error).message;
    await payment.save();
    throw error;
  }
}

export async function confirmPayment(
  paymentId: string,
  userId: string,
  transactionData?: Record<string, string>
) {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new NotFoundError('Payment');
  if (payment.userId.toString() !== userId) throw new BadRequestError('Payment not found');
  if (payment.status === 'completed') return payment;

  const p = getProvider(payment.provider);
  const result = await p.confirmPayment(payment.externalPaymentId ?? '', transactionData);

  if (result.status === 'completed') {
    await addCredits(
      userId,
      payment.creditsAmount,
      'payment_recharge',
      `Purchased ${payment.creditsAmount} credits via ${p.name}`,
      payment._id,
      'Payment'
    );

    payment.status = 'completed';
    payment.completedAt = new Date();
    payment.providerData = { ...payment.providerData, confirmation: result.providerData };
    await payment.save();

    logger.info(
      `Payment completed: ${paymentId}, credits=${payment.creditsAmount}, user=${userId}`
    );
  } else if (result.status === 'failed' || result.status === 'cancelled') {
    payment.status = 'failed';
    payment.providerData = { ...payment.providerData, confirmation: result.providerData };
    await payment.save();
  }

  return payment;
}

export async function getUserPayments(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [payments, total] = await Promise.all([
    Payment.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Payment.countDocuments({ userId }),
  ]);

  return {
    payments,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}
