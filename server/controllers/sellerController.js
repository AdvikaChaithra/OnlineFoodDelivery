//server/controllers/sellerController.js
import jwt from 'jsonwebtoken';
import { cookieOptions, COOKIE_MAX_AGE } from '../configs/cookie.js';

// Login Seller : /api/seller/login

export const sellerLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!process.env.SELLER_EMAIL || !process.env.SELLER_PASSWORD) {
            return res.json({ success: false, message: "Seller account is not configured" })
        }

        if (password === process.env.SELLER_PASSWORD && email === process.env.SELLER_EMAIL) {
            const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '7d' });

            res.cookie('sellerToken', token, { ...cookieOptions(), maxAge: COOKIE_MAX_AGE });

            return res.json({ success: true, message: "Logged In" });
        } else {
            return res.json({ success: false, message: "Invalid Credentials" })

        }
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}


// Seller isAuth : /api/seller/is-auth
export const isSellerAuth = async (req, res) => {
    return res.json({ success: true })
}



// Logout Seller : /api/seller/logout
export const sellerLogout = async (req, res) => {
    try {
        res.clearCookie('sellerToken', cookieOptions());
        return res.json({ success: true, message: "Logged Out" })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}
