const express = require("express");
const { requireAuth, requireRole } = require("../../middleware/auth");
const controller = require("./controller");

const router = express.Router();
router.use(requireAuth, requireRole("tenant_admin"));

router.get("/", controller.list);
router.post("/", controller.create);
router.patch("/:id/active", controller.setActive);

module.exports = router;
