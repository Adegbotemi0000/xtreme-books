const express = require("express");
const { requireAuth } = require("../../middleware/auth");
const controller = require("./controller");

const router = express.Router();
router.use(requireAuth);

router.get("/invoices", controller.listInvoices);
router.get("/invoices/receivables-ageing", controller.receivablesAgeing);
router.get("/invoices/:id", controller.getInvoice);
router.post("/invoices", controller.createInvoice);
router.post("/invoices/:id/issue", controller.issueInvoice);
router.post("/invoices/:id/payments", controller.recordPayment);
router.post("/invoices/:id/cancel", controller.cancelInvoice);

router.get("/quotations", controller.listQuotations);
router.post("/quotations", controller.createQuotation);
router.post("/quotations/:id/convert", controller.convertQuotation);

module.exports = router;
