//server/middlewares/authSeller.js
import jwt from 'jsonwebtoken';

const authSeller = async (req, res, next) => {
    const { sellerToken } = req.cookies;

    if (!sellerToken) {
        return res.json({ success: false, message: 'Not Authorized' });
    }

    let tokenDecode;
    try {
        tokenDecode = jwt.verify(sellerToken, process.env.JWT_SECRET);
    } catch {
        return res.json({ success: false, message: 'Not Authorized' });
    }

    if (!process.env.SELLER_EMAIL || tokenDecode?.email !== process.env.SELLER_EMAIL) {
        return res.json({ success: false, message: 'Not Authorized' });
    }

    next();
}

export default authSeller;
