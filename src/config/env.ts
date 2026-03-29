import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optional(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

export const env = {
  nodeEnv: optional('NODE_ENV', 'development'),
  port: parseInt(optional('PORT', '4000'), 10),
  clientUrl: optional('CLIENT_URL', 'http://localhost:5173'),

  mongodbUri: optional('MONGODB_URI', 'mongodb://localhost:27017/studyai'),

  jwtSecret: optional('JWT_SECRET', 'dev_secret_change_in_production'),
  jwtExpiresIn: optional('JWT_EXPIRES_IN', '7d'),

  google: {
    clientId: optional('GOOGLE_CLIENT_ID', ''),
    clientSecret: optional('GOOGLE_CLIENT_SECRET', ''),
    callbackUrl: optional(
      'GOOGLE_CALLBACK_URL',
      'http://localhost:4000/api/auth/google/callback'
    ),
  },

  gcs: {
    bucketName: optional('GCS_BUCKET_NAME', 'studyai-documents'),
    projectId: optional('GCS_PROJECT_ID', ''),
    serviceAccountJson: optional('GCS_SERVICE_ACCOUNT_JSON', ''),
  },

  gemini: {
    apiKey: optional('GEMINI_API_KEY', ''),
    model: optional('GEMINI_MODEL', 'gemini-2.5-flash-lite-preview-06-17'),
  },

  credits: {
    initial: parseInt(optional('INITIAL_CREDITS', '50'), 10),
  },

  payment: {
    provider: optional('PAYMENT_PROVIDER', 'mock') as 'mock' | 'mercadopago' | 'paypal',
    mercadopago: {
      accessToken: optional('MERCADOPAGO_ACCESS_TOKEN', ''),
      publicKey: optional('MERCADOPAGO_PUBLIC_KEY', ''),
      webhookSecret: optional('MERCADOPAGO_WEBHOOK_SECRET', ''),
    },
    paypal: {
      clientId: optional('PAYPAL_CLIENT_ID', ''),
      clientSecret: optional('PAYPAL_CLIENT_SECRET', ''),
      mode: optional('PAYPAL_MODE', 'sandbox') as 'sandbox' | 'live',
    },
  },

  upload: {
    maxFileSizeMb: parseInt(optional('MAX_FILE_SIZE_MB', '20'), 10),
  },

  isDev: optional('NODE_ENV', 'development') === 'development',
  isProd: optional('NODE_ENV', 'development') === 'production',
};
