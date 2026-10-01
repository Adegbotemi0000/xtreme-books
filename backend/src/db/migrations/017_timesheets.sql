-- Timesheet entries: staff hours logged against an optional project, on a
-- given date, with a task description. Standalone data capture for now —
-- Payroll's "days missed" field stays a manual admin input rather than
-- auto-deriving from these, matching xtreme-finance-system's own scope
-- (its timesheets module has no payroll wiring either).
CREATE TABLE timesheet_entries (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  staff_id INTEGER NOT NULL REFERENCES staff(id),
  project_id INTEGER REFERENCES projects(id),
  date DATE NOT NULL,
  hours NUMERIC(5, 2) NOT NULL,
  task_description TEXT,
  created_by INTEGER REFERENCES users(id),
  deleted_at TIMESTAMPTZ,
  deleted_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_timesheet_entries_tenant ON timesheet_entries (tenant_id, date);
