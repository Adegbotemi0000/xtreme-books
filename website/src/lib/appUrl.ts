// The logged-in app (frontend/) is a separate deployment from this marketing
// site — set NEXT_PUBLIC_APP_URL once it has a real domain. Defaults to the
// local dev server so links work out of the box while both run locally.
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5173";

export function appSignupUrl(plan?: string) {
  return plan ? `${APP_URL}/signup?plan=${plan}` : `${APP_URL}/signup`;
}

export function appLoginUrl() {
  return `${APP_URL}/login`;
}
