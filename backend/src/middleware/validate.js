export function requireFields(fields) {
  return (req, res, next) => {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Request body must be a JSON object' },
      });
    }
    for (const field of fields) {
      const val = req.body[field];
      if (typeof val !== 'string' || val.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: `Field '${field}' must be a non-empty string` },
        });
      }
    }
    next();
  };
}