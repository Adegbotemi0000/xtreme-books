// Applies a tenant's chosen brand color as the app's --primary token, with a
// darker variant (for hover/active) and a light tint (for badges/active-nav
// backgrounds) derived from it — so picking any custom color still gets a
// usable 3-shade set without the tenant having to pick three colors.
function hexToRgb(hex) {
  const m = hex.replace("#", "").match(/.{1,2}/g);
  return m ? m.map((h) => parseInt(h, 16)) : [0, 54, 243];
}

function rgbToHex([r, g, b]) {
  return `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;
}

function shade(hex, amount) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex([r * (1 - amount), g * (1 - amount), b * (1 - amount)]);
}

function tint(hex, amount) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex([r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount]);
}

export function applyBrandColor(hex) {
  if (!hex) return;
  const root = document.documentElement.style;
  root.setProperty("--primary", hex);
  root.setProperty("--primary-dark", shade(hex, 0.18));
  root.setProperty("--primary-light", tint(hex, 0.88));
}
