const express = require("express");
const { requireAuth } = require("../../middleware/auth");
const controller = require("./controller");

const router = express.Router();
router.use(requireAuth);

router.get("/", controller.list);
router.get("/:id", controller.detail);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

module.exports = router;
