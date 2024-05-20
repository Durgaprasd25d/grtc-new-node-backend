const jwt = require('jsonwebtoken');
const User = require('../models/user.js');
const secret = 'your_jwt_secret';

module.exports = async (req, res, next) => {
    try {
        const token = req.header('Authorization');
        if (!token || !token.startsWith('Bearer ')) {
            throw new Error('Unauthorized');
        }
        const tokenWithoutBearer = token.slice(7); // Remove 'Bearer ' from the token
        const decoded = jwt.verify(tokenWithoutBearer, secret);
        const user = await User.findById(decoded.userId);
        if (!user) {
            throw new Error('Unauthorized');
        }
        req.user = user;
        next();
    } catch (err) {
        res.status(401).send('Please authenticate');
    }
};
