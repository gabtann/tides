export function rateLimit({ max, windowMs }) {
  const store = new Map();

  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of store.entries()) {
      if (now > data.resetTime) {
        store.delete(ip);
      }
    }
  }, windowMs);
  
  if (cleanup.unref) {
    cleanup.unref();
  }

  return (req, res, next) => {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();

    let data = store.get(ip);
    if (!data || now > data.resetTime) {
      data = { count: 0, resetTime: now + windowMs };
    }

    data.count++;
    store.set(ip, data);

    if (data.count > max) {
      return res.status(429).json({
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Too many requests' }
      });
    }

    next();
  };
}
