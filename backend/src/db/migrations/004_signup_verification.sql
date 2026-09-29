-- Email verification at signup (separate from login OTP/2FA) and a
-- per-tenant onboarding flag gating the full app until company details are
-- set up — see docs/03-platform-modules.md's onboarding flow.

ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN verification_code TEXT;
ALTER TABLE users ADD COLUMN verification_expires_at TIMESTAMPTZ;

ALTER TABLE tenants ADD COLUMN setup_completed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE tenants ADD COLUMN logo_url TEXT;
