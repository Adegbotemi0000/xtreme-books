const express = require("express");
const { requireAuth } = require("../../middleware/auth");
const controller = require("./controller");

const router = express.Router();
router.use(requireAuth);

router.get("/", controller.list);
router.post("/", controller.create);
router.delete("/:id", controller.archive);

module.exports = router;
