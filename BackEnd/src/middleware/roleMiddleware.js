/**kimheng's part */

export const checkRole = (roles) => {
  return (req, res, next) => {
    // Check if user object exists from prior auth middleware verification
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Authentication token is missing.' });
    }

    const hasRole = Array.isArray(roles) 
      ? roles.includes(req.user.role) 
      : req.user.role === roles;

    if (!hasRole) {
      return res.status(403).json({ success: false, message: `Access denied. Requires one of these roles: ${roles}` });
    }

    next();
  };
};

export default checkRole;
