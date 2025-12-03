/**
 * Admin Authorization Middleware
 * 
 * Checks if user has admin role
 * Can be extended to support different permission levels
 */

export const requireAdmin = (req, res, next) => {
  try {
    // User should be authenticated first (requireAuth middleware)
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Check if user is admin
    // Note: In production, this should check the user's role in the database
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    
    if (!adminEmails.includes(req.user.email)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: 'Admin access required'
      });
    }

    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

/**
 * Feature flag for admin features
 * Can be used to gradually enable admin panel
 */
export const adminFeatureEnabled = (req, res, next) => {
  const adminFeaturesEnabled = process.env.ADMIN_FEATURES_ENABLED === 'true';
  
  if (!adminFeaturesEnabled) {
    return res.status(403).json({
      error: 'Feature not available',
      message: 'Admin features are currently disabled'
    });
  }
  
  next();
};
