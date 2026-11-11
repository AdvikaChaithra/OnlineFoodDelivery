//server/controllers/orderController.js

import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Address from "../models/Address.js";
import Stripe from "stripe";
import User from "../models/User.js";

// Created lazily so a missing STRIPE_SECRET_KEY doesn't crash the whole
// server at startup (COD orders and the rest of the API keep working).
let stripeInstance = null;
const getStripe = () => {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Online payment is not configured");
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeInstance;
};

const TAX_RATE = 0.02;

/* ===================== SHARED VALIDATION ===================== */
// Validates the request, recomputes prices from the database (never trust
// the client) and returns { error } or { orderItems, products, amount, tax }.

const buildOrder = async (userId, items, address) => {
  if (!Array.isArray(items) || items.length === 0 || !address) {
    return { error: "Invalid order data" };
  }

  if (!mongoose.isValidObjectId(address)) {
    return { error: "Invalid address" };
  }

  const userAddress = await Address.findOne({ _id: address, userId });
  if (!userAddress) {
    return { error: "Address not found" };
  }

  const orderItems = [];
  const products = [];
  let subtotal = 0;

  for (const item of items) {
    const quantity = Number(item?.quantity);

    if (!mongoose.isValidObjectId(item?.product)) {
      return { error: "Product not found" };
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return { error: "Invalid product quantity" };
    }

    const product = await Product.findById(item.product);

    if (!product) {
      return { error: "Product not found" };
    }

    if (!product.inStock) {
      return { error: `${product.name} is out of stock` };
    }

    subtotal += product.offerPrice * quantity;
    orderItems.push({ product: product._id.toString(), quantity });
    products.push({ product, quantity });
  }

  const tax = Math.floor(subtotal * TAX_RATE);
  const amount = Math.round((subtotal + tax) * 100) / 100;

  return { orderItems, products, amount, tax };
};

/* ===================== PLACE ORDER COD ===================== */
/* /api/order/cod */

export const placeOrderCOD = async (req, res) => {
  try {
    const userId = req.userId;
    const { items, address } = req.body;

    const result = await buildOrder(userId, items, address);
    if (result.error) {
      return res.json({ success: false, message: result.error });
    }

    await Order.create({
      userId,
      items: result.orderItems,
      address,
      amount: result.amount,
      paymentType: "COD",
      isPaid: false,
    });

    // Empty the saved cart now that the order exists
    await User.findByIdAndUpdate(userId, { cartItems: {} });

    res.json({
      success: true,
      message: "Order placed successfully",
    });
  } catch (error) {
    console.error("COD Order Error:", error);

    res.json({
      success: false,
      message: error.message,
    });
  }
};

/* ===================== PLACE ORDER STRIPE ===================== */
/* /api/order/stripe */

export const placeOrderStripe = async (req, res) => {
  try {
    const userId = req.userId;
    const { items, address } = req.body;
    const origin = req.headers.origin || process.env.FRONTEND_URL;

    if (!origin) {
      return res.json({ success: false, message: "Unable to determine return URL" });
    }

    const stripe = getStripe();

    const result = await buildOrder(userId, items, address);
    if (result.error) {
      return res.json({ success: false, message: result.error });
    }

    const line_items = result.products.map(({ product, quantity }) => ({
      price_data: {
        currency: "inr",
        product_data: {
          name: product.name,
        },
        // Math.round avoids float errors such as 19.99 * 100 = 1998.999…
        unit_amount: Math.round(product.offerPrice * 100),
      },
      quantity,
    }));

    if (result.tax > 0) {
      line_items.push({
        price_data: {
          currency: "inr",
          product_data: {
            name: "Tax",
          },
          unit_amount: Math.round(result.tax * 100),
        },
        quantity: 1,
      });
    }

    const order = await Order.create({
      userId,
      items: result.orderItems,
      address,
      amount: result.amount,
      paymentType: "Online",
      isPaid: false,
    });

    let session;
    try {
      session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items,
        mode: "payment",
        success_url: `${origin}/loader?next=my-orders`,
        cancel_url: `${origin}/cart`,
        metadata: {
          orderId: order._id.toString(),
          userId: userId.toString(),
        },
      });
    } catch (stripeError) {
      // Don't leave an orphaned unpaid order behind
      await Order.findByIdAndDelete(order._id);
      throw stripeError;
    }

    res.json({
      success: true,
      url: session.url,
    });
  } catch (error) {
    console.error("Stripe Order Error:", error);

    res.json({
      success: false,
      message: error.message,
    });
  }
};

/* ===================== STRIPE WEBHOOK ===================== */
/* /stripe */

export const stripeWebhooks = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = getStripe().webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const { orderId, userId } = session.metadata || {};

        if (session.payment_status !== "paid") break;

        if (orderId) {
          await Order.findByIdAndUpdate(orderId, {
            isPaid: true,
            paidAt: new Date(),
          });
        }

        if (userId) {
          await User.findByIdAndUpdate(userId, {
            cartItems: {},
          });
        }

        break;
      }

      // The customer abandoned checkout: remove the unpaid order.
      // (A single failed card attempt is NOT final — the customer can retry
      // in the same session — so we don't delete on payment_failed.)
      case "checkout.session.expired": {
        const session = event.data.object;
        const { orderId } = session.metadata || {};

        if (orderId) {
          await Order.findOneAndDelete({ _id: orderId, isPaid: false });
        }

        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error) {
    console.error("Webhook processing error:", error);
    return res.status(500).json({ received: false });
  }

  res.json({ received: true });
};

/* ===================== GET USER ORDERS ===================== */
/* /api/order/user */

export const getUserOrders = async (req, res) => {
  try {
    const userId = req.userId;

    // Customers see all their orders (online orders still awaiting Stripe
    // confirmation are shown with a "Pending" payment status).
    const orders = await Order.find({ userId })
      .populate({
        path: "items.product",
        select: "name image offerPrice category",
      })
      .populate("address")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("User Orders Error:", error);

    res.json({
      success: false,
      message: error.message,
    });
  }
};

/* ===================== GET SELLER ORDERS ===================== */
/* /api/order/seller */

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [{ paymentType: "COD" }, { isPaid: true }],
    })
      .populate({
        path: "items.product",
        select: "name image offerPrice category",
      })
      .populate("address")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Seller Orders Error:", error);

    res.json({
      success: false,
      message: error.message,
    });
  }
};
