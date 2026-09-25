export function requireFields(fields) {
  return (req, res, next) => {
    for (const field of fields) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: `Field '${field}' is required` },
        });
      }
    }
    next();
  };
}