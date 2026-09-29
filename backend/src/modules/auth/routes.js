const express = require("express");
const { requireAuth } = require("../../middleware/auth");
const controller = require("./controller");

const router = express.Router();

router.post("/signup", controller.signup);
router.post("/verify-email", controller.verifyEmail);
router.post("/resend-verification", controller.resendVerification);
router.post("/login", controller.login);
router.post("/login/otp", controller.loginOtp);
router.get("/me", requireAuth, controller.me);
router.post("/otp/setup", requireAuth, controller.otpSetup);
router.post("/otp/setup/verify", requireAuth, controller.otpSetupVerify);
router.post("/otp/disable", requireAuth, controller.otpDisable);

module.exports = router;
