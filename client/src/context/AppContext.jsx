//client/src/context/AppContext.jsx

import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {

    const currency = import.meta.env.VITE_CURRENCY;

    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [isSeller, setIsSeller] = useState(false);
    const [showUserLogin, setShowUserLogin] = useState(false);
    const [products, setProducts] = useState([]);

    const [cartItems, setCartItems] = useState({});
    const [searchQuery, setSearchQuery] = useState("");

    /* ---------------- Seller Auth ---------------- */

    const fetchSeller = async () => {
        try {
            const { data } = await axios.get("/api/seller/is-auth");

            if (data.success) {
                setIsSeller(true);
            } else {
                setIsSeller(false);
            }

        } catch {
            setIsSeller(false);
        }
    };

    /* ---------------- User Auth ---------------- */

    const fetchUser = async () => {
        try {

            const { data } = await axios.get("/api/user/is-auth");

            if (data.success) {
                setUser(data.user);
                setCartItems(data.user.cartItems || {});
            }

        } catch {
            setUser(null);
        }
    };

    /* ---------------- Products ---------------- */

    const fetchProducts = async () => {
        try {

            const { data } = await axios.get("/api/product/list");

            if (data.success) {
                setProducts(data.products);
            } else {
                toast.error(data.message);
            }

        } catch (error) {
            toast.error(error.message);
        }
    };

    /* ---------------- Add To Cart ---------------- */

    const addToCart = (itemId) => {

        const cartData = structuredClone(cartItems);

        if (cartData[itemId]) {
            cartData[itemId] += 1;
        } else {
            cartData[itemId] = 1;
        }

        setCartItems(cartData);

        toast.success("Added to Cart", {
            id: "cart-toast",
            duration: 1500,
            position: "top-center",
        });
    };

    /* ---------------- Update Cart ---------------- */

    const updateCartItem = (itemId, quantity) => {

        const cartData = structuredClone(cartItems);

        cartData[itemId] = quantity;

        setCartItems(cartData);

        toast.success("Cart Updated", {
            id: "cart-toast",
            duration: 1500,
            position: "top-center",
        });
    };

    /* ---------------- Remove From Cart ---------------- */

    const removeFromCart = (itemId) => {

        const cartData = structuredClone(cartItems);

        if (cartData[itemId]) {

            cartData[itemId] -= 1;

            if (cartData[itemId] === 0) {
                delete cartData[itemId];
            }
        }

        setCartItems(cartData);

        toast.success("Removed from Cart", {
            id: "cart-toast",
            duration: 1500,
            position: "top-center",
        });
    };

    /* ---------------- Cart Count ---------------- */

    const getCartCount = () => {

        let totalCount = 0;

        for (const item in cartItems) {
            totalCount += cartItems[item];
        }

        return totalCount;
    };

    /* ---------------- Cart Amount ---------------- */

    const getCartAmount = () => {

        let totalAmount = 0;

        for (const item in cartItems) {

            const product = products.find(
                (product) => product._id === item
            );

            if (product && cartItems[item] > 0) {
                totalAmount += product.offerPrice * cartItems[item];
            }
        }

        return Math.floor(totalAmount * 100) / 100;
    };

    /* ---------------- Initial Load ---------------- */

    useEffect(() => {

        fetchSeller();
        fetchProducts();
        fetchUser();

    }, []);

    /* ---------------- Sync Cart To Backend ---------------- */

    useEffect(() => {

        const updateCart = async () => {

            try {

                const { data } = await axios.post("/api/cart/update", {
                    cartItems,
                });

                if (!data.success) {
                    toast.error(data.message);
                }

            } catch (error) {
                toast.error(error.message);
            }
        };

        if (user) {
            updateCart();
        }

    }, [cartItems]);

    /* ---------------- Context Value ---------------- */

    const value = {
        navigate,
        user,
        setUser,
        isSeller,
        setIsSeller,
        showUserLogin,
        setShowUserLogin,
        products,
        currency,
        addToCart,
        updateCartItem,
        removeFromCart,
        cartItems,
        searchQuery,
        setSearchQuery,
        getCartAmount,
        getCartCount,
        axios,
        fetchProducts,
        setCartItems,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    return useContext(AppContext);
};