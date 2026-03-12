const { authMiddleware } = require('../middlewares/authMiddleware');

const roleMiddleware = (role) => (req, res, next) => {
    if (req.user.role !== role) return res.status(403).send('Access denied');
    next();
};

module.exports = roleMiddleware;
