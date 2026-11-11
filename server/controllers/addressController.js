import Address from "../models/Address.js"


// Add Address : /api/address/add
export const addAddress = async (req, res) => {
    try {
        const { address } = req.body;
        const userId = req.userId;

        if (!address || typeof address !== "object") {
            return res.json({ success: false, message: "Invalid address data" })
        }

        // Never let the client override the owner or _id
        const { _id, userId: _ignored, ...addressData } = address;
        await Address.create({ ...addressData, userId })
        res.json({ success: true, message: "Address added successfully" })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });

    }
}

// Get Address: /api/address/get
export const getAddress = async (req, res) => {
    try {
        //const {userId} = req.body
        const userId = req.userId;
        const addresses = await Address.find({ userId })
        res.json({ success: true, addresses })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}