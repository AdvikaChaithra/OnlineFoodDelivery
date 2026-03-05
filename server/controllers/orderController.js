//server/controllers/orderController.js
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import stripe from "stripe";
import User from "../models/User.js";

// -------------------- PLACE ORDER COD --------------------
// /api/order/cod
export const placeOrderCOD = async (req, res) => {
  try {

    const userId = req.userId; // FIXED
    const { items, address } = req.body;

    if (!address || items.length === 0) {
      return res.json({ success: false, message: "Invalid data" });
    }

    // Calculate total amount
    let amount = await items.reduce(async (acc, item) => {
      const product = await Product.findById(item.product);
      return (await acc) + product.offerPrice * item.quantity;
    }, 0);

    // Add 2% tax
    amount += Math.floor(amount * 0.02);

    await Order.create({
      userId,
      items,
      amount,
      address,
      paymentType: "COD",
    });

    return res.json({ success: true, message: "Order Placed Successfully" });

  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};


// -------------------- PLACE ORDER STRIPE --------------------
// /api/order/stripe
export const placeOrderStripe = async (req, res) => {
  try {

    const userId = req.userId; // FIXED
    const { items, address } = req.body;
    const { origin } = req.headers;

    if (!address || items.length === 0) {
      return res.json({ success: false, message: "Invalid data" });
    }

    let productData = [];

    // Calculate amount
    let amount = await items.reduce(async (acc, item) => {
      const product = await Product.findById(item.product);

      productData.push({
        name: product.name,
        price: product.offerPrice,
        quantity: item.quantity,
      });

      return (await acc) + product.offerPrice * item.quantity;
    }, 0);

    // Add 2% tax
    amount += Math.floor(amount * 0.02);

    const order = await Order.create({
      userId,
      items,
      amount,
      address,
      paymentType: "Online",
    });

    // Initialize Stripe
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

    const line_items = productData.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
        },
        unit_amount: Math.floor(item.price * 100),
      },
      quantity: item.quantity,
    }));

    // Add tax as separate item
    line_items.push({
      price_data: {
        currency: "inr",
        product_data: {
          name: "Tax",
        },
        unit_amount: Math.round(amount * 0.02 * 100),
      },
      quantity: 1,
    });

    // Create Stripe session
    const session = await stripeInstance.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${origin}/loader?next=my-orders`,
      cancel_url: `${origin}/cart`,
      metadata: {
        orderId: order._id.toString(),
        userId: userId.toString(),
      },
    });

    return res.json({ success: true, url: session.url });

  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};


// -------------------- STRIPE WEBHOOK --------------------
// /stripe
export const stripeWebhooks = async (request, response) => {

  const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

  const sig = request.headers["stripe-signature"];
  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(
      request.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return response.status(400).send(`Webhook Error: ${error.message}`);
  }

  switch (event.type) {

    case "checkout.session.completed": {

      const session = event.data.object;
      const { orderId, userId } = session.metadata;

      await Order.findByIdAndUpdate(orderId, {
        isPaid: true,
        paidAt: new Date(),
      });

      await User.findByIdAndUpdate(userId, { cartItems: {} });

      break;
    }

    case "payment_intent.payment_failed": {

      const paymentIntent = event.data.object;

      const session = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntent.id,
      });

      const { orderId } = session.data[0].metadata;

      await Order.findByIdAndDelete(orderId);

      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  response.json({ received: true });
};


// -------------------- GET USER ORDERS --------------------
// /api/order/user
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
      .populate("items.product address")
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};


// -------------------- GET ALL ORDERS (SELLER) --------------------
// /api/order/seller
export const getAllOrders = async (req, res) => {
  try {

    const orders = await Order.find({
      $or: [{ paymentType: "COD" }, { isPaid: true }],
    })
      .populate("items.product address")
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};