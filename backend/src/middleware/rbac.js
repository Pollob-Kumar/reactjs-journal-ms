const { ROLES } = require('../config/constants');

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Check if user has any of the required roles
    const hasRole = req.user.roles.some(role => roles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: `User role(s) [${req.user.roles.join(', ')}] is not authorized to access this resource. Required role(s): [${roles.join(', ')}]`
      });
    }

    next();
  };
};

// Check if user is the owner of the resource or has admin/editor role
exports.authorizeOwnerOrRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Allow if user has any of the specified roles
    const hasRole = req.user.roles.some(role => roles.includes(role));
    
    // Allow if user is the owner (checked by resource ID)
    const isOwner = req.resource && req.resource.submittedBy && 
                    req.resource.submittedBy.toString() === req.user._id.toString();

    if (!hasRole && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }

    next();
  };
};