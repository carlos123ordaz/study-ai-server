"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
function required(key) {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}
function optional(key, defaultValue) {
    return process.env[key] ?? defaultValue;
}
exports.env = {
    nodeEnv: optional('NODE_ENV', 'development'),
    port: parseInt(optional('PORT', '4000'), 10),
    clientUrl: optional('CLIENT_URL', 'http://localhost:5173'),
    mongodbUri: optional('MONGODB_URI', 'mongodb://localhost:27017/studyai'),
    jwtSecret: optional('JWT_SECRET', 'dev_secret_change_in_production'),
    jwtExpiresIn: optional('JWT_EXPIRES_IN', '7d'),
    google: {
        clientId: optional('GOOGLE_CLIENT_ID', ''),
        clientSecret: optional('GOOGLE_CLIENT_SECRET', ''),
        callbackUrl: optional('GOOGLE_CALLBACK_URL', 'http://localhost:4000/api/auth/google/callback'),
    },
    gcs: {
        bucketName: optional('GCS_BUCKET_NAME', 'studyai-documents'),
        projectId: optional('GCS_PROJECT_ID', ''),
        credentialsPath: optional('GOOGLE_APPLICATION_CREDENTIALS', ''),
    },
    gemini: {
        apiKey: optional('GEMINI_API_KEY', ''),
        model: optional('GEMINI_MODEL', 'gemini-2.5-flash-lite-preview-06-17'),
    },
    credits: {
        initial: parseInt(optional('INITIAL_CREDITS', '50'), 10),
    },
    payment: {
        provider: optional('PAYMENT_PROVIDER', 'mock'),
        mercadopago: {
            accessToken: optional('MERCADOPAGO_ACCESS_TOKEN', ''),
            publicKey: optional('MERCADOPAGO_PUBLIC_KEY', ''),
            webhookSecret: optional('MERCADOPAGO_WEBHOOK_SECRET', ''),
        },
        paypal: {
            clientId: optional('PAYPAL_CLIENT_ID', ''),
            clientSecret: optional('PAYPAL_CLIENT_SECRET', ''),
            mode: optional('PAYPAL_MODE', 'sandbox'),
        },
    },
    upload: {
        maxFileSizeMb: parseInt(optional('MAX_FILE_SIZE_MB', '20'), 10),
    },
    isDev: optional('NODE_ENV', 'development') === 'development',
    isProd: optional('NODE_ENV', 'development') === 'production',
};
//# sourceMappingURL=env.js.map