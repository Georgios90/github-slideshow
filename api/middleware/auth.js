/**
 * Authentication Middleware
 *
 * Optional API key authentication for securing endpoints
 */

/**
 * Verify API key from request headers
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
function verifyApiKey(req, res, next) {
  // Skip auth if API_KEY is not configured
  if (!process.env.API_KEY) {
    return next();
  }

  const apiKey = req.headers['x-api-key'] || req.query.api_key;

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'API key is required',
        code: 'MISSING_API_KEY'
      }
    });
  }

  if (apiKey !== process.env.API_KEY) {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Invalid API key',
        code: 'INVALID_API_KEY'
      }
    });
  }

  next();
}

/**
 * Optional authentication - logs but doesn't block
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
function optionalAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;

  if (apiKey && process.env.API_KEY && apiKey === process.env.API_KEY) {
    req.authenticated = true;
  } else {
    req.authenticated = false;
  }

  next();
}

module.exports = {
  verifyApiKey,
  optionalAuth
};
