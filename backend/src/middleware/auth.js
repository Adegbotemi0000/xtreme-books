const jwt = require("jsonwebtoken");
const { pool } = require("../db/pool");

// Verifies the JWT, then does a live is_active check on every request so
// disabling a login kicks out an in-progress session immediately — matches
// xtreme-finance-system's requireAuth. Also carries tenant_id on the token,
// so every downstream query can filter by req.tenantId with zero exceptions.
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  if (payload.otpPending) {
    return res.status(401).json({ error: "OTP verification required" });
  }

  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [payload.sub]);
    const user = rows[0];
    if (!user || !user.is_active) {
      return res.status(401).json({ error: "Account is inactive" });
    }
    req.user = user;
    req.tenantId = user.tenant_id;
    next();
  } catch (err) {
    next(err);
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Not permitted" });
    }
    next();
  };
}

// For platform (super-admin) routes — no tenant_id at all.
function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.role !== "super_admin") {
    return res.status(403).json({ error: "Not permitted" });
  }
  next();
}

module.exports = { requireAuth, requireRole, requireSuperAdmin };
