import mongoose from "mongoose"
import User from "../models/User.js"


// Update User CartData : /api/cart/update
export const updateCart = async (req, res) => {
    try {

        const userId = req.userId;
        const { cartItems } = req.body;

        if (!cartItems || typeof cartItems !== "object" || Array.isArray(cartItems)) {
            return res.json({ success: false, message: "Invalid cart data" });
        }

        // Keep only valid product ids with positive integer quantities
        const cleanCart = {};
        for (const [productId, quantity] of Object.entries(cartItems)) {
            const qty = Number(quantity);
            if (mongoose.isValidObjectId(productId) && Number.isInteger(qty) && qty > 0) {
                cleanCart[productId] = qty;
            }
        }

        await User.findByIdAndUpdate(userId, { cartItems: cleanCart });
        res.json({ success: true, message: "Cart Updated" });

    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
}