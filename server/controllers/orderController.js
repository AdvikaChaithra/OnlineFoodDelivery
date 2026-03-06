//server/controllers/orderController.js

import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Stripe from "stripe";
import User from "../models/User.js";

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

/* ===================== PLACE ORDER COD ===================== */
/* /api/order/cod */

export const placeOrderCOD = async (req, res) => {
  try {
    const userId = req.userId;
    const { items, address } = req.body;

    if (!items || items.length === 0 || !address) {
      return res.json({ success: false, message: "Invalid order data" });
    }

    let amount = 0;

    for (const item of items) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.json({ success: false, message: "Product not found" });
      }

      amount += product.offerPrice * item.quantity;
    }

    const tax = Math.floor(amount * 0.02);
    amount += tax;

    await Order.create({
      userId,
      items,
      address,
      amount,
      paymentType: "COD",
      isPaid: false,
    });

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
    const { origin } = req.headers;

    if (!items || items.length === 0 || !address) {
      return res.json({ success: false, message: "Invalid order data" });
    }

    let amount = 0;
    const line_items = [];

    for (const item of items) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.json({ success: false, message: "Product not found" });
      }

      amount += product.offerPrice * item.quantity;

      line_items.push({
        price_data: {
          currency: "inr",
          product_data: {
            name: product.name,
          },
          unit_amount: Math.floor(product.offerPrice * 100),
        },
        quantity: item.quantity,
      });
    }

    const tax = Math.floor(amount * 0.02);
    amount += tax;

    const order = await Order.create({
      userId,
      items,
      address,
      amount,
      paymentType: "Online",
      isPaid: false,
    });

    line_items.push({
      price_data: {
        currency: "inr",
        product_data: {
          name: "Tax",
        },
        unit_amount: Math.floor(tax * 100),
      },
      quantity: 1,
    });

    const session = await stripeInstance.checkout.sessions.create({
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
    event = stripeInstance.webhooks.constructEvent(
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
        const { orderId, userId } = session.metadata;

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

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;

        const sessions = await stripeInstance.checkout.sessions.list({
          payment_intent: paymentIntent.id,
        });

        if (sessions.data.length > 0) {
          const { orderId } = sessions.data[0].metadata;

          await Order.findByIdAndDelete(orderId);
        }

        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error) {
    console.error("Webhook processing error:", error);
  }

  res.json({ received: true });
};

/* ===================== GET USER ORDERS ===================== */
/* /api/order/user */

export const getUserOrders = async (req, res) => {
  try {
    const userId = req.userId;

    const orders = await Order.find({
      userId,
      $or: [
        { paymentType: "COD" },
        { paymentType: "Online" },
        { isPaid: true },
      ],
    })
      .populate({
        path: "items.product",
        select: "name image offerPrice",
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
        select: "name image offerPrice",
      })
      .populate("address")
      .sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
      return res.json({
        success: true,
        orders: [],
      });
    }

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
