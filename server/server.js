//server/server.js
import "dotenv/config";
import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import connectDB, { isDBConnected } from "./configs/db.js";
import userRouter from "./routes/userRoute.js";
import sellerRouter from "./routes/sellerRoute.js";
import connectCloudinary from "./configs/cloudinary.js";
import productRouter from "./routes/productRoute.js";
import cartRouter from "./routes/cartRoute.js";
import addressRouter from "./routes/addressRoute.js";
import orderRouter from "./routes/orderRoute.js";
import { stripeWebhooks } from "./controllers/orderController.js";

const app = express();
const port = process.env.PORT || 4000;

/* -------------------- DATABASE + CLOUDINARY -------------------- */

await connectDB();
await connectCloudinary();

/* -------------------- STRIPE WEBHOOK -------------------- */
// Must be registered BEFORE express.json() so Stripe gets the raw body
// it needs for signature verification.

app.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhooks
);

/* -------------------- MIDDLEWARE -------------------- */

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

/* -------------------- ROUTES -------------------- */

app.get("/", (req, res) => {
  res.send("API is Working");
});

// Every API route needs the database. If it is unreachable, try to reconnect
// once and otherwise answer immediately with a clear message instead of
// letting each query hang until Mongoose times out.
app.use("/api", async (req, res, next) => {
  if (isDBConnected() || (await connectDB())) return next();
  return res.status(503).json({
    success: false,
    message: "Database is unavailable right now. Please try again later.",
  });
});

app.use("/api/user", userRouter);
app.use("/api/seller", sellerRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/address", addressRouter);
app.use("/api/order", orderRouter);

/* -------------------- SERVER -------------------- */

// On Vercel the app is exported and invoked as a serverless function;
// locally we start a normal HTTP server.
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

export default app;
