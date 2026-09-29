const nodemailer = require("nodemailer");

// No SMTP credentials are configured for this project yet (see
// docs/11-open-questions.md — no email/OTP-delivery vendor decided). Until
// SMTP_HOST/SMTP_USER/SMTP_PASS are set, this logs the code instead of
// sending it, and the auth controller echoes it back in the API response
// (dev-only) so signup/verification stays testable end-to-end.
function isConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

let transporter = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

async function sendVerificationEmail(email, code) {
  if (!isConfigured()) {
    console.log(`[mailer] SMTP not configured — verification code for ${email}: ${code}`);
    return { delivered: false };
  }

  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || "Kora <no-reply@korabooks.ng>",
    to: email,
    subject: "Verify your Kora account",
    text: `Your verification code is ${code}. It expires in 15 minutes.`,
  });
  return { delivered: true };
}

module.exports = { isConfigured, sendVerificationEmail };
