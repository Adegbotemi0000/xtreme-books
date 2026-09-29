// Ordered keyword -> answer pairs, mirroring xtreme-finance-system's
// dataAnswers.js intent-matching approach (first match wins, so specific
// phrases are checked before generic ones). No LLM key is configured for
// this project yet (see docs/11-open-questions.md), so this is the whole
// "AI" for now — swapping in a real LLM for the general-question fallback
// is a self-contained change to controller.js later.
const INTENTS = [
  { pattern: /invoice/i, answer: "To create an invoice: go to Invoices → + New invoice, pick a customer, add line items, then Save as draft. Use 'Issue invoice' when you're ready — that's the point it posts to your books and gets an IRN." },
  { pattern: /vat/i, answer: "VAT is calculated automatically per line item on invoices, at the rate set on each product. You can review and adjust tax settings under Tax Centre." },
  { pattern: /payroll|payslip/i, answer: "Payroll entries are recorded under Payroll for each staff member and period. Automatic PAYE/pension calculation is landing soon — for now, gross/net pay and deductions are entered directly." },
  { pattern: /trial balance|general ledger|journal/i, answer: "Every transaction posts a balanced journal entry automatically. You can see the Trial Balance and General Ledger under Finance, or drill into any entry under Journals." },
  { pattern: /user|role|permission/i, answer: "Tenant admins can add teammates under Users, assigning them a role (Accountant, Sales/Operations, Management, or Admin). Roles are enforced on the server, not just hidden in the menu." },
  { pattern: /wallet|virtual account/i, answer: "The Wallet module needs KYC verification before it activates — start that under Wallet → Start KYC." },
  { pattern: /password|otp|2fa|login/i, answer: "You can turn on OTP (two-factor login) from your account settings. If you're locked out, a tenant admin can reset your access under Users." },
];

const FALLBACK =
  "I'm not sure about that one yet. Want me to pass this to our support team? They typically reply within one business day.";

function answerFromKnowledge(message) {
  const hit = INTENTS.find((i) => i.pattern.test(message));
  return hit ? hit.answer : null;
}

module.exports = { answerFromKnowledge, FALLBACK };
