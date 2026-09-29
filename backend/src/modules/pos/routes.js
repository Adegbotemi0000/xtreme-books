const express = require("express");
const { requireAuth } = require("../../middleware/auth");
const controller = require("./controller");

const router = express.Router();
router.use(requireAuth);

router.get("/", controller.list);
router.get("/:id", controller.getSale);
router.post("/", controller.createSale);

module.exports = router;
