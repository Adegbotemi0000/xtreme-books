import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FileText,
  FileClock,
  Users,
  Percent,
  ShoppingCart,
  Truck,
  Store,
  Package,
  Boxes,
  Factory,
  Receipt,
  Building2,
  Landmark,
  ScrollText,
  BookOpen,
  BookMarked,
  Scale,
  ClipboardCheck,
  Wallet as WalletIcon,
  FolderKanban,
  BarChart3,
  ShieldCheck,
  UserCog,
  UsersRound,
  Banknote,
  Clock,
  Settings as SettingsIcon,
  Trash2,
  History,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  ChevronDown,
  RefreshCw,
  ArrowLeftRight,
  PiggyBank,
  Undo2,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "../AuthContext";
import { ChatWidget } from "./ChatWidget";
import { applyBrandColor } from "../lib/brandColor";
import { getInitialTheme, applyTheme } from "../lib/theme";

// Nav grouping mirrors docs/02-modules.md + docs/03-platform-modules.md —
// one section per module family, matching xtreme-finance-system's
// NAV_SECTIONS convention (adminOnly is UX only; every route is still
// server-checked by requireRole).
const NAV_SECTIONS = [
  {
    title: "Overview",
    links: [{ to: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Sales",
    links: [
      { to: "/invoices", label: "Invoices", icon: FileText },
      { to: "/quotations", label: "Quotations", icon: FileClock },
      { to: "/receivables", label: "Receivables", icon: Landmark },
      { to: "/customers", label: "Customers", icon: Users },
      { to: "/discounts", label: "Discounts", icon: Percent },
    ],
  },
  {
    title: "Purchasing",
    links: [
      { to: "/purchases", label: "Purchases", icon: ShoppingCart },
      { to: "/vendor-credits", label: "Vendor Credits", icon: Undo2 },
      { to: "/suppliers", label: "Suppliers", icon: Truck },
    ],
  },
  {
    title: "Operations",
    links: [
      { to: "/pos", label: "POS", icon: Store },
      { to: "/products", label: "Products", icon: Package },
      { to: "/inventory", label: "Inventory", icon: Boxes },
      { to: "/production", label: "Production", icon: Factory },
      { to: "/expenses", label: "Expenses", icon: Receipt },
      { to: "/expenses/recurring", label: "Recurring Expenses", icon: RefreshCw },
      { to: "/branches", label: "Branches", icon: Building2, adminOnly: true },
    ],
  },
  {
    title: "Finance",
    links: [
      { to: "/accounts", label: "Cash & Bank", icon: Landmark },
      { to: "/bank-reconciliation", label: "Bank Reconciliation", icon: ArrowLeftRight, adminOnly: true },
      { to: "/loans", label: "Loans", icon: Banknote },
      { to: "/tax", label: "Tax Centre", icon: ScrollText },
      { to: "/gl-accounts", label: "Chart of Accounts", icon: BookOpen },
      { to: "/journals", label: "Journals", icon: BookMarked },
      { to: "/general-ledger", label: "General Ledger", icon: Scale },
      { to: "/trial-balance", label: "Trial Balance", icon: ClipboardCheck },
      { to: "/fixed-assets", label: "Fixed Assets", icon: Building2 },
      { to: "/wallet", label: "Wallet", icon: WalletIcon, adminOnly: true },
    ],
  },
  {
    title: "Projects",
    links: [
      { to: "/projects", label: "Projects", icon: FolderKanban },
      { to: "/budgets", label: "Budgets", icon: PiggyBank },
    ],
  },
  {
    title: "Reports",
    links: [
      { to: "/reports", label: "Reports", icon: BarChart3 },
      { to: "/audit-pack", label: "Audit-Ready Pack", icon: ShieldCheck, adminOnly: true },
    ],
  },
  {
    title: "Admin",
    links: [
      { to: "/users", label: "Users", icon: UserCog, adminOnly: true },
      { to: "/staff", label: "Staff", icon: UsersRound, adminOnly: true },
      { to: "/timesheet", label: "Timesheet", icon: Clock, adminOnly: true },
      { to: "/payroll", label: "Payroll", icon: Banknote, adminOnly: true },
      { to: "/settings", label: "Settings", icon: SettingsIcon, adminOnly: true },
      { to: "/trash", label: "Trash", icon: Trash2, adminOnly: true },
      { to: "/logs", label: "Audit Log", icon: History, adminOnly: true },
    ],
  },
];

const COLLAPSE_KEY = "kora_sidebar_collapsed";
const SECTIONS_KEY = "kora_sidebar_sections_collapsed";

export function Layout() {
  const { user, tenant, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "tenant_admin";

  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === "1");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);
  const [collapsedSections, setCollapsedSections] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SECTIONS_KEY) || "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  useEffect(() => {
    localStorage.setItem(SECTIONS_KEY, JSON.stringify(collapsedSections));
  }, [collapsedSections]);

  useEffect(() => {
    if (tenant?.brand_color) applyBrandColor(tenant.brand_color);
  }, [tenant?.brand_color]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function toggleSection(title) {
    setCollapsedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  }

  const initials = user?.name
    ?.split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="app-shell">
      <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <span className="mark">K</span>
            {!collapsed && <span>Kora</span>}
          </div>
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>
        {NAV_SECTIONS.map((section) => {
          const sectionCollapsed = !collapsed && collapsedSections[section.title];
          return (
            <div className="nav-section" key={section.title}>
              {collapsed ? (
                <div className="nav-section-title">{section.title}</div>
              ) : (
                <button
                  type="button"
                  className="nav-section-title nav-section-toggle"
                  onClick={() => toggleSection(section.title)}
                  aria-expanded={!sectionCollapsed}
                >
                  <span>{section.title}</span>
                  <ChevronDown size={13} style={{ transform: sectionCollapsed ? "rotate(-90deg)" : "none" }} />
                </button>
              )}
              {!sectionCollapsed &&
                section.links
                  .filter((l) => !l.adminOnly || isAdmin)
                  .map((link) => {
                    const Icon = link.icon;
                    return (
                      <NavLink
                        key={link.to}
                        to={link.to}
                        end={link.to === "/"}
                        title={collapsed ? link.label : undefined}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
                      >
                        <Icon size={18} strokeWidth={2} />
                        {!collapsed && <span>{link.label}</span>}
                      </NavLink>
                    );
                  })}
            </div>
          );
        })}
      </aside>

      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.35)", zIndex: 30 }}
        />
      )}

      <div className="main-area">
        <div className="topbar">
          <button
            type="button"
            className="sidebar-toggle"
            style={{ display: "none" }}
            id="mobile-nav-toggle"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div />
          <div className="topbar-user">
            <button
              type="button"
              className="icon-btn"
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <span style={{ fontSize: "0.86rem", fontWeight: 600 }}>{user?.name}</span>
            <div className="avatar">{initials}</div>
            <button className="btn secondary" onClick={() => { logout(); navigate("/login"); }}>
              Log out
            </button>
          </div>
        </div>
        <div className="page">
          <Outlet />
        </div>
      </div>
      <ChatWidget />
    </div>
  );
}
