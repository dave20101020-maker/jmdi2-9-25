// Global Express error handler
export default function errorHandler(err, req, res, next) {  
  // Default to 500
  let status = err.status || err.statusCode || 500;

  // Map some common error types/statuses
  if (err.name === 'ValidationError' || err.name === 'CastError') status = 400;
  if (err.name === 'UnauthorizedError' || err.message === 'Not authenticated') status = 401;
  if (err.message && err.message.toLowerCase().includes('not authorized')) status = 403;

  const message = err.message || 'Server error';

  // Simple JSON response
  res.status(status).json({ error: true, message });
}
