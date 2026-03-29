"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const env_1 = require("../config/env");
const { combine, timestamp, printf, colorize, json } = winston_1.default.format;
const devFormat = combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
}));
const prodFormat = combine(timestamp(), json());
exports.logger = winston_1.default.createLogger({
    level: env_1.env.isDev ? 'debug' : 'info',
    format: env_1.env.isDev ? devFormat : prodFormat,
    transports: [
        new winston_1.default.transports.Console(),
        ...(env_1.env.isProd
            ? [
                new winston_1.default.transports.File({ filename: 'logs/error.log', level: 'error' }),
                new winston_1.default.transports.File({ filename: 'logs/combined.log' }),
            ]
            : []),
    ],
});
//# sourceMappingURL=logger.js.map