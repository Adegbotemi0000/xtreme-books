const model = require("./model");
const { recordAudit } = require("../../middleware/audit");
const { asyncHandler } = require("../../utils/asyncHandler");

const listInvoices = asyncHandler(async (req, res) => res.json(await model.listInvoices(req.tenantId)));

const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await model.getInvoice(req.tenantId, req.params.id);
  if (!invoice) return res.status(404).json({ error: "Invoice not found" });
  res.json(invoice);
});

const createInvoice = asyncHandler(async (req, res) => {
  const invoice = await model.createInvoice(req.tenantId, req.body, req.user.id);
  await recordAudit({ tenantId: req.tenantId, entityType: "invoice", entityId: invoice.id, userId: req.user.id, action: "create" });
  res.status(201).json(invoice);
});

const issueInvoice = asyncHandler(async (req, res) => {
  const invoice = await model.issueInvoice(req.tenantId, req.params.id, req.user.id);
  await recordAudit({ tenantId: req.tenantId, entityType: "invoice", entityId: invoice.id, userId: req.user.id, action: "issue" });
  res.json(invoice);
});

const recordPayment = asyncHandler(async (req, res) => {
  const invoice = await model.recordPayment(req.tenantId, req.params.id, req.body, req.user.id);
  await recordAudit({ tenantId: req.tenantId, entityType: "invoice", entityId: invoice.id, userId: req.user.id, action: "payment_received" });
  res.json(invoice);
});

const cancelInvoice = asyncHandler(async (req, res) => {
  const invoice = await model.cancelInvoice(req.tenantId, req.params.id, req.user.id);
  await recordAudit({ tenantId: req.tenantId, entityType: "invoice", entityId: invoice.id, userId: req.user.id, action: "cancel" });
  res.json(invoice);
});

const receivablesAgeing = asyncHandler(async (req, res) => res.json(await model.receivablesAgeing(req.tenantId)));

const listQuotations = asyncHandler(async (req, res) => res.json(await model.listQuotations(req.tenantId)));

const createQuotation = asyncHandler(async (req, res) => {
  const quotation = await model.createQuotation(req.tenantId, req.body, req.user.id);
  await recordAudit({ tenantId: req.tenantId, entityType: "quotation", entityId: quotation.id, userId: req.user.id, action: "create" });
  res.status(201).json(quotation);
});

const convertQuotation = asyncHandler(async (req, res) => {
  const invoice = await model.convertQuotationToInvoice(req.tenantId, req.params.id, req.user.id);
  res.status(201).json(invoice);
});

module.exports = {
  listInvoices,
  getInvoice,
  createInvoice,
  issueInvoice,
  recordPayment,
  cancelInvoice,
  receivablesAgeing,
  listQuotations,
  createQuotation,
  convertQuotation,
};
