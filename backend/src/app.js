const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const { simpleListRouter } = require("./utils/simpleListRouter");

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

// Shared by /login and /login/otp — a 6-digit TOTP is brute-forceable fast
// otherwise, matches xtreme-finance-system.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/login/otp", authLimiter);

app.use("/api/auth", require("./modules/auth/routes"));
app.use("/api/users", require("./modules/users/routes"));
app.use("/api/customers", require("./modules/customers/routes"));
app.use("/api/products", require("./modules/products/routes"));
app.use("/api/gl-accounts", require("./modules/glAccounts/routes"));
app.use("/api/journals", require("./modules/journals/routes"));
app.use("/api/sales", require("./modules/sales/routes"));
app.use("/api/dashboard", require("./modules/dashboard/routes"));
app.use("/api/reports", require("./modules/reports/routes"));
app.use("/api/accounts", require("./modules/accounts/routes"));
app.use("/api/bank-reconciliation", require("./modules/bankReconciliation/routes"));
app.use("/api/trash", require("./modules/trash/routes"));
app.use("/api/tax", require("./modules/tax/routes"));
app.use("/api/wallet", require("./modules/wallet/routes"));
app.use("/api/logs", require("./modules/logs/routes"));
app.use("/api/tenants", require("./modules/tenants/routes"));
app.use("/api/pos", require("./modules/pos/routes"));
app.use("/api/production", require("./modules/production/routes"));
app.use("/api/documents", require("./modules/documents/routes"));
app.use("/api/assistant", require("./modules/assistant/routes"));

// Modules scaffolded at list+create(+archive) depth for now — real business
// logic (approvals, GL posting, depreciation runs, payroll calculation)
// lands module-by-module next. Every page these back is real and navigable.
app.use(
  "/api/suppliers",
  simpleListRouter({
    table: "suppliers",
    entityType: "supplier",
    columns: [
      { key: "name", column: "name" },
      { key: "tin", column: "tin" },
      { key: "email", column: "email" },
      { key: "phone", column: "phone" },
      { key: "address", column: "address" },
    ],
    importFields: [
      { key: "name", label: "Name", required: true, example: "Acme Supplies Ltd" },
      { key: "tin", label: "TIN", example: "12345678-0001" },
      { key: "email", label: "Email", example: "hello@acme.com" },
      { key: "phone", label: "Phone", example: "08012345678" },
      { key: "address", label: "Address", example: "12 Marina Road, Lagos" },
    ],
  })
);

app.use("/api/purchases", require("./modules/purchases/routes"));
app.use("/api/vendor-credits", require("./modules/vendorCredits/routes"));

app.use("/api/expenses", require("./modules/expenses/routes"));
app.use("/api/recurring-expenses", require("./modules/recurringExpenses/routes"));

app.use(
  "/api/categories",
  simpleListRouter({
    table: "categories",
    entityType: "category",
    columns: [
      { key: "type", column: "type" },
      { key: "name", column: "name" },
    ],
    hasDeletedAt: false,
    orderBy: "name",
    importFields: [
      { key: "type", label: "Type", required: true, example: "expense" },
      { key: "name", label: "Name", required: true, example: "Office supplies" },
    ],
  })
);

app.use(
  "/api/staff",
  simpleListRouter({
    table: "staff",
    entityType: "staff",
    columns: [
      { key: "name", column: "name" },
      { key: "position", column: "position" },
      { key: "bankName", column: "bank_name" },
      { key: "bankAccountNumber", column: "bank_account_number" },
      { key: "monthlySalary", column: "monthly_salary" },
    ],
    orderBy: "name",
    importFields: [
      { key: "name", label: "Name", required: true, example: "Chidinma Okafor" },
      { key: "position", label: "Position", example: "Accountant" },
      { key: "bankName", label: "Bank Name", example: "GTBank" },
      { key: "bankAccountNumber", label: "Bank Account Number", example: "0123456789" },
      { key: "monthlySalary", label: "Monthly Salary", example: 250000 },
    ],
  })
);

app.use("/api/payroll", require("./modules/payroll/routes"));
app.use("/api/timesheets", require("./modules/timesheets/routes"));

app.use("/api/loans", require("./modules/loans/routes"));

app.use("/api/fixed-assets", require("./modules/fixedAssets/routes"));
app.use("/api/budgets", require("./modules/budgets/routes"));

app.use(
  "/api/projects",
  simpleListRouter({
    table: "projects",
    entityType: "project",
    columns: [
      { key: "name", column: "name" },
      { key: "code", column: "code" },
      { key: "customerId", column: "customer_id" },
      { key: "status", column: "status" },
      { key: "budget", column: "budget" },
    ],
    hasDeletedAt: false,
    orderBy: "name",
    importFields: [
      { key: "name", label: "Name", required: true, example: "Office Renovation" },
      { key: "code", label: "Code", example: "PRJ-001" },
      { key: "status", label: "Status", example: "active" },
      { key: "budget", label: "Budget", example: 500000 },
    ],
  })
);

app.use(
  "/api/discounts",
  simpleListRouter({
    table: "discounts",
    entityType: "discount",
    columns: [
      { key: "name", column: "name" },
      { key: "type", column: "type" },
      { key: "value", column: "value" },
    ],
    hasDeletedAt: false,
    orderBy: "name",
    importFields: [
      { key: "name", label: "Name", required: true, example: "Loyalty discount" },
      { key: "type", label: "Type", required: true, example: "percentage" },
      { key: "value", label: "Value", required: true, example: 10 },
    ],
  })
);

app.use(
  "/api/branches",
  simpleListRouter({
    table: "branches",
    entityType: "branch",
    columns: [
      { key: "name", column: "name" },
      { key: "address", column: "address" },
    ],
    hasDeletedAt: false,
    orderBy: "name",
    importFields: [
      { key: "name", label: "Name", required: true, example: "Lekki Branch" },
      { key: "address", label: "Address", example: "45 Admiralty Way, Lekki" },
    ],
  })
);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

module.exports = app;
