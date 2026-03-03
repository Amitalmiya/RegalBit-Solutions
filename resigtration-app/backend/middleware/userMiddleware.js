const { verifyToken } = require('../utils/tokenHelpers')
const { getUserFromToken } = require('../controllers/userController')

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    
    if (!authHeader) {
      return res.status(401).json({ message: "Authorization header missing" });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
  
    if (!decoded) 
      return res.status(401).json({ message: "Invalid or expired token"});
  
    req.user = decoded;
    next();
    
  }catch(error){
    console.error("Token verification Error: ", error.message);
    res.status(500).json({ message: "Internal authentication error" });
  }
};

module.exports = authenticateToken;
