const express = require("express");
const multer = require("multer");
const { requireAuth } = require("../../middleware/auth");
const { recordAudit } = require("../../middleware/audit");
const { asyncHandler } = require("../../utils/asyncHandler");
const model = require("./model");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

const router = express.Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { entityType, entityId } = req.query;
    if (!entityType || !entityId) return res.status(400).json({ error: "entityType and entityId are required" });
    res.json(await model.listForEntity(req.tenantId, entityType, Number(entityId)));
  })
);

router.post(
  "/",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    const { entityType, entityId } = req.body;
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    if (!entityType || !entityId) return res.status(400).json({ error: "entityType and entityId are required" });
    if (!model.ALLOWED_ENTITY_TYPES.includes(entityType)) {
      return res.status(400).json({ error: `entityType must be one of: ${model.ALLOWED_ENTITY_TYPES.join(", ")}` });
    }

    const doc = await model.create({
      tenantId: req.tenantId,
      entityType,
      entityId: Number(entityId),
      originalFilename: req.file.originalname,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      buffer: req.file.buffer,
      userId: req.user.id,
    });

    await recordAudit({
      tenantId: req.tenantId,
      entityType: `${entityType}_document`,
      entityId: doc.id,
      userId: req.user.id,
      action: "create",
      reason: `${req.file.originalname} attached to ${entityType} #${entityId}`,
    });
    res.status(201).json(doc);
  })
);

router.get(
  "/:id/download",
  asyncHandler(async (req, res) => {
    const doc = await model.findById(req.tenantId, req.params.id);
    if (!doc) return res.status(404).json({ error: "Document not found" });
    res.setHeader("Content-Type", doc.mime_type || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${doc.original_filename.replace(/"/g, "")}"`);
    res.send(doc.file_data);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const doc = await model.remove(req.tenantId, req.params.id);
    if (!doc) return res.status(404).json({ error: "Document not found" });
    await recordAudit({
      tenantId: req.tenantId,
      entityType: `${doc.entity_type}_document`,
      entityId: doc.id,
      userId: req.user.id,
      action: "delete",
      reason: `${doc.original_filename} removed from ${doc.entity_type} #${doc.entity_id}`,
    });
    res.json({ ok: true });
  })
);

module.exports = router;
