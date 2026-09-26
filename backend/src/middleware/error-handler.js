export function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'Something went wrong';
  
  if ((code && code.startsWith('SECTORS_')) || status >= 500) {
    message = 'An error occurred while communicating with external services';
  }

  res.status(status).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}