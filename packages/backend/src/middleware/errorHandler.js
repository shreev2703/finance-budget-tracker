export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function notFound(req, res) {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
}

// Express recognises error middleware by its 4-argument signature.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res
      .status(err.status)
      .json({ error: err.message, details: err.details });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body must be valid JSON' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
