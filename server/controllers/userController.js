import User from "../models/User.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookieOptions, COOKIE_MAX_AGE } from "../configs/cookie.js";

const setAuthCookie = (res, userId) => {
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { ...cookieOptions(), maxAge: COOKIE_MAX_AGE });
}

// Register User : /api/user/register
export const register = async (req, res) => {
    try {
        const name = req.body.name?.trim();
        const email = req.body.email?.trim();
        const { password } = req.body;

        if (!name || !email || !password) {
            return res.json({ success: false, message: 'Missing Details' })
        }

        if (password.length < 6) {
            return res.json({ success: false, message: 'Password must be at least 6 characters' })
        }

        const existingUser = await User.findOne({ email })

        if (existingUser)
            return res.json({ success: false, message: 'User already exists' })

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await User.create({ name, email, password: hashedPassword })

        setAuthCookie(res, user._id);

        return res.json({ success: true, user: { _id: user._id, email: user.email, name: user.name, cartItems: user.cartItems } })

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });

    }
}


// Login USer : /api/user/login
export const login = async (req, res) => {
    try {
        const email = req.body.email?.trim();
        const { password } = req.body;

        if (!email || !password)
            return res.json({ success: false, message: 'Email and Password are required' });
        const user = await User.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch)
            return res.json({ success: false, message: 'Invalid email or password' });

        setAuthCookie(res, user._id);

        return res.json({ success: true, user: { _id: user._id, email: user.email, name: user.name, cartItems: user.cartItems } })

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });

    }
}


// Check Auth : /api/user/is-auth
export const isAuth = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId).select("-password")
        if (!user) {
            return res.json({ success: false, message: 'Not Authorized' })
        }
        return res.json({ success: true, user })

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}


// Logout User : /api/user/logout
export const logout = async (req, res) => {
    try {
        res.clearCookie('token', cookieOptions());
        return res.json({ success: true, message: "Logged Out" })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}
