import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import { Layout } from "./components/Layout";
import { LoadingScreen } from "./components/LoadingScreen";

import { Login } from "./pages/Login";
import { LoginOtp } from "./pages/LoginOtp";
import { Signup } from "./pages/Signup";
import { VerifyEmail } from "./pages/VerifyEmail";
import { Dashboard } from "./pages/Dashboard";
import { CompanySetup } from "./pages/CompanySetup";
import { Customers } from "./pages/Customers";
import { Products } from "./pages/Products";
import { Inventory } from "./pages/Inventory";
import { Invoices } from "./pages/Invoices";
import { NewInvoice } from "./pages/NewInvoice";
import { InvoiceDetail } from "./pages/InvoiceDetail";
import { Quotations } from "./pages/Quotations";
import { Receivables } from "./pages/Receivables";
import { Suppliers } from "./pages/Suppliers";
import { Purchases } from "./pages/Purchases";
import { Expenses } from "./pages/Expenses";
import { Accounts } from "./pages/Accounts";
import { Loans } from "./pages/Loans";
import { Tax } from "./pages/Tax";
import { GlAccounts } from "./pages/GlAccounts";
import { Journals } from "./pages/Journals";
import { JournalDetail } from "./pages/JournalDetail";
import { GeneralLedger } from "./pages/GeneralLedger";
import { TrialBalance } from "./pages/TrialBalance";
import { FixedAssets } from "./pages/FixedAssets";
import { Wallet } from "./pages/Wallet";
import { Projects } from "./pages/Projects";
import { Discounts } from "./pages/Discounts";
import { Branches } from "./pages/Branches";
import { Staff } from "./pages/Staff";
import { Payroll } from "./pages/Payroll";
import { Users } from "./pages/Users";
import { Trash } from "./pages/Trash";
import { Logs } from "./pages/Logs";
import { Settings } from "./pages/Settings";
import { Pos } from "./pages/Pos";
import { RecurringExpenses } from "./pages/RecurringExpenses";
import { BankReconciliation } from "./pages/BankReconciliation";
import { Budgets } from "./pages/Budgets";
import { VendorCredits } from "./pages/VendorCredits";
import { Timesheet } from "./pages/Timesheet";
import { Reports } from "./pages/Reports";
import { AuditPack } from "./pages/AuditPack";
import { Production } from "./pages/Production";
import { FileManager } from "./pages/ComingSoonPages";

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { user } = useAuth();
  if (user?.role !== "tenant_admin") return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/login/otp" element={<LoginOtp />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/company-setup" element={<CompanySetup />} />

        <Route path="/invoices" element={<Invoices />} />
        <Route path="/invoices/new" element={<NewInvoice />} />
        <Route path="/invoices/:id" element={<InvoiceDetail />} />
        <Route path="/quotations" element={<Quotations />} />
        <Route path="/receivables" element={<Receivables />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/discounts" element={<Discounts />} />

        <Route path="/purchases" element={<Purchases />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/vendor-credits" element={<VendorCredits />} />

        <Route path="/pos" element={<Pos />} />
        <Route path="/products" element={<Products />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/production" element={<Production />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/expenses/recurring" element={<RecurringExpenses />} />
        <Route path="/branches" element={<RequireAdmin><Branches /></RequireAdmin>} />

        <Route path="/accounts" element={<Accounts />} />
        <Route path="/bank-reconciliation" element={<RequireAdmin><BankReconciliation /></RequireAdmin>} />
        <Route path="/loans" element={<Loans />} />
        <Route path="/tax" element={<Tax />} />
        <Route path="/gl-accounts" element={<GlAccounts />} />
        <Route path="/journals" element={<Journals />} />
        <Route path="/journals/:id" element={<JournalDetail />} />
        <Route path="/general-ledger" element={<GeneralLedger />} />
        <Route path="/trial-balance" element={<TrialBalance />} />
        <Route path="/fixed-assets" element={<FixedAssets />} />
        <Route path="/wallet" element={<RequireAdmin><Wallet /></RequireAdmin>} />
        <Route path="/budgets" element={<Budgets />} />

        <Route path="/projects" element={<Projects />} />

        <Route path="/files" element={<FileManager />} />

        <Route path="/reports" element={<Reports />} />
        <Route path="/audit-pack" element={<RequireAdmin><AuditPack /></RequireAdmin>} />

        <Route path="/users" element={<RequireAdmin><Users /></RequireAdmin>} />
        <Route path="/staff" element={<RequireAdmin><Staff /></RequireAdmin>} />
        <Route path="/payroll" element={<RequireAdmin><Payroll /></RequireAdmin>} />
        <Route path="/timesheet" element={<RequireAdmin><Timesheet /></RequireAdmin>} />
        <Route path="/settings" element={<RequireAdmin><Settings /></RequireAdmin>} />
        <Route path="/trash" element={<RequireAdmin><Trash /></RequireAdmin>} />
        <Route path="/logs" element={<RequireAdmin><Logs /></RequireAdmin>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
