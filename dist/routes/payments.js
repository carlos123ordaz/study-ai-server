"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const paymentController_1 = require("../controllers/paymentController");
const router = (0, express_1.Router)();
// Webhook - no auth
router.post('/webhook', paymentController_1.paymentWebhook);
// Protected routes
router.use(auth_1.requireAuth);
router.get('/packages', paymentController_1.getPackages);
router.post('/', paymentController_1.createPayment);
router.post('/:id/confirm', paymentController_1.confirmPaymentHandler);
router.get('/', paymentController_1.listPayments);
exports.default = router;
//# sourceMappingURL=payments.js.map