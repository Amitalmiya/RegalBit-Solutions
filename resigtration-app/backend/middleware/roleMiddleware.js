const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "Amit@123$";

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader)
    return res.status(401).json({ message: "Access denied, token missing." });

  const token = authHeader && authHeader.split(" ")[1];
  if(!token) {
    return res.status(401).json({message: "Access denied, token missing."})
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("JWT verification error : ", error.message);
    return res.status(403).json({ message: "Invalid token" });
  }
};

const isAdmin = (req, res, next) => {
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
    return next();
    }
    return res.status(403).json({ message: "Admin/SuperAdmin access only"});
};

const isSuperAdmin = (req, res, next) => {
    if(req.user.role === 'superadmin'){
      return next();
    } 
    return res.status(403).json({message: "Access denied: SuperAdmin access only"})
}

const isAdminOrSuperAdmin  = (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'superadmin'){
    return next();
  } 
  return res.status(403).json({message: "Access denied: Admin or SuperAdmin only"});
}

module.exports = {verifyToken, isAdmin, isSuperAdmin, isAdminOrSuperAdmin }