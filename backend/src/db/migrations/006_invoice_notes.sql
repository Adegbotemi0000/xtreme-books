-- Customer-facing notes and terms on invoices, matching the reference
-- product's invoice builder (Customer Notes / Terms & Conditions fields).
ALTER TABLE invoices ADD COLUMN customer_notes TEXT;
ALTER TABLE invoices ADD COLUMN terms TEXT;
