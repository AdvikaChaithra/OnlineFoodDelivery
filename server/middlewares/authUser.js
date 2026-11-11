//server/middlewares/authUser.js
import jwt from 'jsonwebtoken';

const authUser = async (req, res, next) => {
    const { token } = req.cookies;

    if (!token) {
        return res.json({ success: false, message: 'Not Authorized' });
    }

    let tokenDecode;
    try {
        tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return res.json({ success: false, message: 'Not Authorized' });
    }

    if (!tokenDecode?.id) {
        return res.json({ success: false, message: 'Not Authorized' });
    }

    req.userId = tokenDecode.id;
    next();
}

export default authUser
