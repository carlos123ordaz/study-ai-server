"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("express-async-errors");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const passport_1 = __importDefault(require("passport"));
const env_1 = require("./config/env");
require("./config/passport"); // Initialize passport strategies
const errorHandler_1 = require("./middlewares/errorHandler");
const rateLimiter_1 = require("./middlewares/rateLimiter");
const logger_1 = require("./utils/logger");
const auth_1 = __importDefault(require("./routes/auth"));
const documents_1 = __importDefault(require("./routes/documents"));
const quizzes_1 = __importDefault(require("./routes/quizzes"));
const credits_1 = __importDefault(require("./routes/credits"));
const payments_1 = __importDefault(require("./routes/payments"));
const app = (0, express_1.default)();
// ========================
// Security
// ========================
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
}));
app.use((0, cors_1.default)({
    origin: env_1.env.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// ========================
// Body parsing & utilities
// ========================
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// ========================
// Logging
// ========================
if (env_1.env.isDev) {
    app.use((0, morgan_1.default)('dev'));
}
else {
    app.use((0, morgan_1.default)('combined', {
        stream: { write: (msg) => logger_1.logger.info(msg.trim()) },
    }));
}
// ========================
// Auth
// ========================
app.use(passport_1.default.initialize());
// ========================
// Rate limiting
// ========================
app.use('/api', rateLimiter_1.generalLimiter);
// ========================
// Health check
// ========================
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        env: env_1.env.nodeEnv,
    });
});
// ========================
// API Routes
// ========================
app.use('/api/auth', auth_1.default);
app.use('/api/documents', documents_1.default);
app.use('/api/quizzes', quizzes_1.default);
app.use('/api/credits', credits_1.default);
app.use('/api/payments', payments_1.default);
// 404
app.use('*', (_req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});
// ========================
// Error Handler (must be last)
// ========================
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map