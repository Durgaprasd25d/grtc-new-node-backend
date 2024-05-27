const jwt = require('jsonwebtoken');
const Student = require('../models/student.js');
const secret = 'your_jwt_secret';

module.exports = async (req, res, next) => {
    try {
        const token = req.header('Authorization');
        if (!token || !token.startsWith('Bearer ')) {
            throw new Error('Unauthorized');
        }
        const tokenWithoutBearer = token.slice(7); // Remove 'Bearer ' from the token
        const decoded = jwt.verify(tokenWithoutBearer, secret);
        const student = await Student.findById(decoded.studentId);
        if (!student) {
            throw new Error('Unauthorized');
        }
        req.student = student;
        next();
    } catch (err) {
        res.status(401).send('Please authenticate');
    }
};
