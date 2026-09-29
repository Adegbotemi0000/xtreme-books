-- Rounds out Company Setup to match competitor onboarding depth: legal
-- structure, a proper State field (Nigerian address/tax jurisdiction, not
-- just free-text address), and team size (used to suggest a plan tier).

ALTER TABLE tenants ADD COLUMN business_type TEXT;
ALTER TABLE tenants ADD COLUMN state TEXT;
ALTER TABLE tenants ADD COLUMN team_size TEXT;

-- Matched against the reference competitor's Organization Profile screen
-- (city/zip split out of the address block, social links, a description,
-- and a date display preference) so Company Setup reaches the same depth.
ALTER TABLE tenants ADD COLUMN city TEXT;
ALTER TABLE tenants ADD COLUMN postal_code TEXT;
ALTER TABLE tenants ADD COLUMN social_handle_1 TEXT;
ALTER TABLE tenants ADD COLUMN social_handle_2 TEXT;
ALTER TABLE tenants ADD COLUMN description TEXT;
ALTER TABLE tenants ADD COLUMN date_format TEXT NOT NULL DEFAULT 'DD-MM-YYYY';
