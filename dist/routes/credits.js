"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const creditController_1 = require("../controllers/creditController");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.get('/', creditController_1.getCredits);
router.get('/transactions', creditController_1.getCreditTransactions);
exports.default = router;
//# sourceMappingURL=credits.js.map