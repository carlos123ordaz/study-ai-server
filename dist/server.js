"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const database_1 = require("./config/database");
const env_1 = require("./config/env");
const logger_1 = require("./utils/logger");
const PORT = env_1.env.port;
async function startServer() {
    try {
        await (0, database_1.connectDatabase)();
        const server = app_1.default.listen(PORT, () => {
            logger_1.logger.info(`
┌────────────────────────────────────────┐
│           StudyAI Backend              │
│  Server: http://localhost:${PORT}         │
│  Env:    ${env_1.env.nodeEnv.padEnd(30)} │
└────────────────────────────────────────┘
      `);
        });
        // Graceful shutdown
        const shutdown = async (signal) => {
            logger_1.logger.info(`${signal} received. Shutting down gracefully...`);
            server.close(async () => {
                await (0, database_1.disconnectDatabase)();
                logger_1.logger.info('Server closed');
                process.exit(0);
            });
            // Force close after 30s
            setTimeout(() => {
                logger_1.logger.error('Forced shutdown after timeout');
                process.exit(1);
            }, 30000);
        };
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('unhandledRejection', (reason) => {
            logger_1.logger.error('Unhandled Rejection:', reason);
        });
        process.on('uncaughtException', (error) => {
            logger_1.logger.error('Uncaught Exception:', error);
            process.exit(1);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
//# sourceMappingURL=server.js.map