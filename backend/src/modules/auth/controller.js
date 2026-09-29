const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { authenticator } = require("otplib");
const model = require("./model");
const { recordAudit } = require("../../middleware/audit");
const { asyncHandler } = require("../../utils/asyncHandler");
const { isValidPassword } = require("../../utils/passwordPolicy");
const { sendVerificationEmail } = require("../../utils/mailer");

function issueToken(user, extra = {}) {
  return jwt.sign(
    { sub: user.id, tenantId: user.tenant_id, role: user.role, ...extra },
    process.env.JWT_SECRET,
    { algorithm: "HS256", expiresIn: extra.otpPending ? "5m" : "12h" }
  );
}

function publicUser(user) {
  const { password_hash, otp_secret, verification_code, ...rest } = user;
  return rest;
}

// Self-service SaaS signup: any company can register and immediately get its
// own tenant + admin account — unlike xtreme-finance-system's single
// pre-provisioned admin. Does NOT log the user in yet — a 6-digit email
// code must be confirmed first (verifyEmail).
const signup = asyncHandler(async (req, res) => {
  const { companyName, cacNumber, tin, adminName, adminEmail, password, confirmPassword } = req.body;
  if (!companyName || !adminName || !adminEmail || !password) {
    return res.status(422).json({ error: "companyName, adminName, adminEmail and password are required" });
  }
  if (confirmPassword !== undefined && password !== confirmPassword) {
    return res.status(422).json({ error: "Passwords do not match" });
  }
  if (!isValidPassword(password)) {
    return res
      .status(422)
      .json({ error: "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character" });
  }

  const existing = await model.findByEmail(adminEmail);
  if (existing) return res.status(409).json({ error: "Email already in use" });

  const { tenant, user } = await model.signupTenant({ companyName, cacNumber, tin, adminName, adminEmail, password });
  await recordAudit({
    tenantId: tenant.id,
    entityType: "tenant",
    entityId: tenant.id,
    userId: user.id,
    action: "create",
    reason: "Self-service signup",
  });

  const { delivered } = await sendVerificationEmail(user.email, user.verification_code);
  res.status(201).json({
    verificationRequired: true,
    email: user.email,
    emailDelivered: delivered,
    // Dev-only fallback while no SMTP vendor is configured — see mailer.js.
    devVerificationCode: delivered ? undefined : user.verification_code,
  });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  const user = await model.verifyEmailCode(email || "", code || "");
  if (!user) return res.status(422).json({ error: "Incorrect or expired code" });

  const tenantRows = await require("../../db/pool").pool.query("SELECT * FROM tenants WHERE id = $1", [user.tenant_id]);
  res.json({ token: issueToken(user), user: publicUser(user), tenant: tenantRows.rows[0] });
});

const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const code = await model.regenerateVerificationCode(email || "");
  if (!code) return res.status(404).json({ error: "No pending verification for that email" });
  const { delivered } = await sendVerificationEmail(email, code);
  res.json({ emailDelivered: delivered, devVerificationCode: delivered ? undefined : code });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await model.findByEmail(email || "");
  if (!user || !user.is_active) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password || "", user.password_hash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  if (!user.email_verified) {
    return res.status(403).json({ error: "Please verify your email first", verificationRequired: true, email: user.email });
  }

  if (user.otp_enabled) {
    // Short-lived pending token — useless against any other endpoint since
    // requireAuth rejects otpPending tokens outright.
    return res.json({ otpRequired: true, pendingToken: issueToken(user, { otpPending: true }) });
  }

  res.json({ token: issueToken(user), user: publicUser(user) });
});

const loginOtp = asyncHandler(async (req, res) => {
  const { pendingToken, code } = req.body;
  let payload;
  try {
    payload = require("jsonwebtoken").verify(pendingToken, process.env.JWT_SECRET, { algorithms: ["HS256"] });
  } catch {
    return res.status(401).json({ error: "Invalid or expired pending token" });
  }
  if (!payload.otpPending) return res.status(401).json({ error: "Invalid pending token" });

  const user = await model.findById(payload.sub);
  if (!user || !user.otp_enabled) return res.status(401).json({ error: "OTP not enabled" });

  const valid = authenticator.verify({ token: code, secret: user.otp_secret });
  if (!valid) return res.status(401).json({ error: "Incorrect code" });

  res.json({ token: issueToken(user), user: publicUser(user) });
});

const me = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

const otpSetup = asyncHandler(async (req, res) => {
  const secret = authenticator.generateSecret();
  await model.setOtpSecret(req.user.id, secret);
  const otpauthUrl = authenticator.keyuri(req.user.email, "Kora", secret);
  res.json({ secret, otpauthUrl });
});

// Requires proving a valid code before flipping otp_enabled=true, so a
// half-finished setup can never lock someone out.
const otpSetupVerify = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const user = await model.findById(req.user.id);
  const valid = authenticator.verify({ token: code, secret: user.otp_secret });
  if (!valid) return res.status(422).json({ error: "Incorrect code" });
  await model.enableOtp(req.user.id);
  res.json({ ok: true });
});

const otpDisable = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const valid = await bcrypt.compare(password || "", req.user.password_hash);
  if (!valid) return res.status(401).json({ error: "Incorrect password" });
  await model.disableOtp(req.user.id);
  res.json({ ok: true });
});

module.exports = {
  signup,
  verifyEmail,
  resendVerification,
  login,
  loginOtp,
  me,
  otpSetup,
  otpSetupVerify,
  otpDisable,
};
