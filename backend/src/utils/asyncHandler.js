// Wraps an async route handler so a rejected promise reaches Express's error
// handler instead of crashing the process.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { asyncHandler };
