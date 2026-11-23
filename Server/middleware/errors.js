export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Wraps an async route so rejected promises reach the error handler. */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Document is too large to save' });
  }

  const status = err.status || 500;
  if (status >= 500) console.error('[api]', err);

  res.status(status).json({
    error: status >= 500 ? 'Something went wrong on our side' : err.message,
  });
}
