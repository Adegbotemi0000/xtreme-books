// At least 8 characters, one uppercase, one lowercase, one number, one
// special character. Enforced server-side regardless of what the frontend
// already checks.
const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function isValidPassword(password) {
  return typeof password === "string" && PASSWORD_RULE.test(password);
}

module.exports = { isValidPassword };
