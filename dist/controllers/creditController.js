"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCredits = getCredits;
exports.getCreditTransactions = getCreditTransactions;
const creditService_1 = require("../services/creditService");
const apiResponse_1 = require("../utils/apiResponse");
async function getCredits(req, res) {
    const user = req.user;
    const credits = await (0, creditService_1.getUserCredits)(user._id.toString());
    (0, apiResponse_1.sendSuccess)(res, { credits });
}
async function getCreditTransactions(req, res) {
    const user = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const result = await (0, creditService_1.getCreditHistory)(user._id.toString(), page, limit);
    (0, apiResponse_1.sendSuccess)(res, result.transactions, undefined, 200, {
        pagination: result.pagination,
    });
}
//# sourceMappingURL=creditController.js.map