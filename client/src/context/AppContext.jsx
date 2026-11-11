//client/src/context/AppContext.jsx
/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

// When the server answers with an error status (e.g. 503 "Database is
// unavailable"), show its message instead of axios' generic
// "Request failed with status code ...".
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        const serverMessage = error.response?.data?.message;
        if (serverMessage) error.message = serverMessage;
        else if (!error.response) error.message = "Cannot reach the server. Please check your connection.";
        return Promise.reject(error);
    }
);

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {

    const currency = import.meta.env.VITE_CURRENCY || "₹";

    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [isUserLoading, setIsUserLoading] = useState(true);
    const [isSeller, setIsSeller] = useState(false);
    const [showUserLogin, setShowUserLogin] = useState(false);
    const [products, setProducts] = useState([]);

    const [cartItems, setCartItems] = useState({});
    const [searchQuery, setSearchQuery] = useState("");

    // Set when the cart was loaded from the server, so we don't
    // immediately echo the same cart back to the backend.
    const skipNextSync = useRef(false);

    /* ---------------- Seller Auth ---------------- */

    const fetchSeller = async () => {
        try {
            const { data } = await axios.get("/api/seller/is-auth");
            setIsSeller(Boolean(data.success));
        } catch {
            setIsSeller(false);
        }
    };

    /* ---------------- User Auth ---------------- */

    const fetchUser = async () => {
        try {
            const { data } = await axios.get("/api/user/is-auth");

            if (data.success) {
                skipNextSync.current = true;
                setUser(data.user);
                setCartItems(data.user.cartItems || {});
            } else {
                setUser(null);
            }

        } catch {
            setUser(null);
        } finally {
            setIsUserLoading(false);
        }
    };

    /* ---------------- Login / Logout helpers ---------------- */

    // Called after a successful login/register: merge the guest cart
    // (items added before logging in) with the cart saved on the server.
    const loginUser = (loggedInUser) => {
        const serverCart = loggedInUser.cartItems || {};
        const merged = { ...serverCart };

        for (const id in cartItems) {
            merged[id] = Math.max(merged[id] || 0, cartItems[id]);
        }

        setUser(loggedInUser);
        setCartItems(merged);
    };

    const logoutUser = () => {
        skipNextSync.current = true;
        setUser(null);
        setCartItems({});
    };

    /* ---------------- Products ---------------- */

    const fetchProducts = async () => {
        try {

            const { data } = await axios.get("/api/product/list");

            if (data.success) {
                setProducts(data.products);
            } else {
                toast.error(data.message, { id: "products-error" });
            }

        } catch (error) {
            toast.error(error.message, { id: "products-error" });
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

        if (quantity > 0) {
            cartData[itemId] = quantity;
        } else {
            delete cartData[itemId];
        }

        setCartItems(cartData);

        toast.success(quantity > 0 ? "Cart Updated" : "Removed from Cart", {
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

            if (cartData[itemId] <= 0) {
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

        return Math.round(totalAmount * 100) / 100;
    };

    /* ---------------- Initial Load ---------------- */

    useEffect(() => {

        fetchSeller();
        fetchProducts();
        fetchUser();

    }, []);

    /* ---------------- Drop deleted products from the cart ---------------- */

    useEffect(() => {
        if (products.length === 0) return;

        const ids = new Set(products.map((p) => p._id));
        const stale = Object.keys(cartItems).filter((id) => !ids.has(id));

        if (stale.length > 0) {
            setCartItems((prev) => {
                const next = { ...prev };
                stale.forEach((id) => delete next[id]);
                return next;
            });
        }
    }, [products, cartItems]);

    /* ---------------- Sync Cart To Backend ---------------- */

    useEffect(() => {

        if (skipNextSync.current) {
            skipNextSync.current = false;
            return;
        }

        if (!user) return;

        const updateCart = async () => {

            try {

                const { data } = await axios.post("/api/cart/update", {
                    cartItems,
                });

                if (!data.success) {
                    toast.error(data.message, { id: "cart-sync-error" });
                }

            } catch (error) {
                toast.error(error.message, { id: "cart-sync-error" });
            }
        };

        updateCart();

    }, [cartItems, user]);

    /* ---------------- Context Value ---------------- */

    const value = {
        navigate,
        user,
        setUser,
        isUserLoading,
        loginUser,
        logoutUser,
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
