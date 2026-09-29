-- Fuller company setup fields, modeled on the reference competitor's
-- Organization Profile screen (industry, contact/links, fiscal year, KYC
-- numbers). CAC/NIN/BVN automatic verification is a pending vendor decision
-- (docs/11-open-questions.md #8) — these columns record the numbers a tenant
-- provides; they are not verified against any live registry yet.

ALTER TABLE tenants ADD COLUMN industry TEXT;
ALTER TABLE tenants ADD COLUMN phone TEXT;
ALTER TABLE tenants ADD COLUMN website TEXT;
ALTER TABLE tenants ADD COLUMN nin TEXT;
ALTER TABLE tenants ADD COLUMN bvn TEXT;
ALTER TABLE tenants ADD COLUMN fiscal_year_start_month SMALLINT NOT NULL DEFAULT 1 CHECK (fiscal_year_start_month BETWEEN 1 AND 12);
