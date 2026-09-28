import crypto from 'crypto';

let warned = false;

export function requireApiKey(req, res, next) {
  const expectedKey = process.env.TIDES_API_KEY;
  
  if (!expectedKey) {
    if (!warned) {
      console.warn('WARNING: TIDES_API_KEY is not set. API is running without authentication.');
      warned = true;
    }
    return next();
  }

  const headerVal = req.headers['x-api-key'] || req.headers['authorization'];
  let providedKey = '';
  
  if (headerVal) {
    if (headerVal.startsWith('Bearer ')) {
      providedKey = headerVal.slice(7);
    } else {
      providedKey = headerVal;
    }
  }

  if (!providedKey) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Missing API Key' }
    });
  }

  const expectedBuffer = Buffer.from(expectedKey);
  const providedBuffer = Buffer.from(providedKey);

  if (expectedBuffer.length !== providedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, providedBuffer)) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid API Key' }
    });
  }

  next();
}
