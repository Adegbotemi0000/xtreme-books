-- Per-tenant brand color, applied as the app's --primary CSS token. Defaults
-- to Kora's own electric blue; a tenant can leave it as-is or pick their own.
ALTER TABLE tenants ADD COLUMN brand_color TEXT NOT NULL DEFAULT '#0036f3';
