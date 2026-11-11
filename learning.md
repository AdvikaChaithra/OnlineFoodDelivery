# FoodBasket: Complete Learning Guide (A to Z)

> A full walkthrough of the FoodBasket project: what it does, how every part works, why each technology was chosen, how it was built over seven days, and 20 interview questions with answers.

---

## Table of Contents

1. [What Is FoodBasket?](#1-what-is-foodbasket)
2. [Features at a Glance](#2-features-at-a-glance)
3. [Technology Stack and Why Each Was Chosen](#3-technology-stack-and-why-each-was-chosen)
4. [System Architecture](#4-system-architecture)
5. [Folder Structure (Every File Explained)](#5-folder-structure-every-file-explained)
6. [Environment Variables](#6-environment-variables)
7. [Backend Deep Dive](#7-backend-deep-dive)
8. [Database Models](#8-database-models)
9. [API Reference](#9-api-reference)
10. [Authentication and Authorization](#10-authentication-and-authorization)
11. [Cart System](#11-cart-system)
12. [Orders and Payments (COD + Stripe)](#12-orders-and-payments-cod--stripe)
13. [Image Uploads (Multer + Cloudinary)](#13-image-uploads-multer--cloudinary)
14. [Frontend Deep Dive](#14-frontend-deep-dive)
15. [Styling with Tailwind CSS v4](#15-styling-with-tailwind-css-v4)
16. [Security Measures](#16-security-measures)
17. [Deployment on Vercel](#17-deployment-on-vercel)
18. [Running the Project Locally](#18-running-the-project-locally)
19. [Seven-Day Build Plan (Day 1 to Day 7)](#19-seven-day-build-plan-day-1-to-day-7)
20. [20 Interview Questions with Answers](#20-20-interview-questions-with-answers)
21. [Glossary](#21-glossary)

---

## 1. What Is FoodBasket?

**FoodBasket** is a full-stack online grocery and food delivery web application built with the **MERN stack** (MongoDB, Express, React, Node.js).

It has **two kinds of users**:

| Role | What they can do |
|---|---|
| **Customer** | Browse products by category, search, view product details, add to cart, save delivery addresses, place orders (Cash on Delivery or online card payment through Stripe), and view order history. |
| **Seller (Admin)** | Log in to a separate dashboard, add products with images, toggle stock on/off, delete products, and see all customer orders with delivery addresses and payment status. |

Products are grouped into **seven categories**: Vegetables, Fruits, Drinks, Instant, Dairy, Bakery, and Grains.

**The core idea:** a realistic, end-to-end e-commerce flow covering authentication, a persistent cart, server-side price calculation, cloud image hosting, and real payment processing with webhooks.

---

## 2. Features at a Glance

### Customer side
- **Register and login** with email and password (passwords hashed with bcrypt).
- **Session in an HTTP-only cookie** that lasts 7 days, so users stay logged in after refreshing.
- **Home page** with a hero banner, category tiles, best sellers, a "Why We Are the Best" banner and a newsletter box.
- **All Products page** with **live search** from the navbar.
- **Category pages** (`/products/vegetables`, `/products/fruits`, ...).
- **Product details page** with an image gallery, MRP vs offer price, description bullets, related products, "Add to Cart" and "Buy now".
- **Cart** with quantity selector, remove button, subtotal, 2% tax, total, address picker and payment picker.
- **Guest cart merging:** items added before logging in are kept and merged with the saved cart after login.
- **Persistent cart:** the cart is saved in the database, so it follows the user across devices.
- **Address book:** add multiple addresses and choose one at checkout.
- **Two payment methods:** Cash on Delivery (COD) and Online (Stripe Checkout in INR).
- **My Orders:** order history with items, amount, payment type, paid/pending status and date.
- **Toast notifications** for every action.

### Seller side
- **Separate login** at `/seller` (credentials stored in environment variables).
- **Add Product:** up to 4 images, name, description, category, price and offer price.
- **Product List:** table of all products with an in-stock toggle switch and a delete button with a confirmation modal.
- **Orders:** every COD order and every paid online order, with the customer's address.

---

## 3. Technology Stack and Why Each Was Chosen

### 3.1 Frontend

| Technology | Version | What it does here | Why it was chosen |
|---|---|---|---|
| **React** | 19 | Builds the whole UI from components. | Component-based, huge ecosystem, the most in-demand frontend library. Reusable pieces like `ProductCard` are used on 4+ pages. |
| **Vite** | 7 | Dev server and production bundler. | Starts almost instantly and has fast hot reload (HMR). Much faster than the older Create React App, which is now deprecated. |
| **React Router DOM** | 7 | Client-side routing (`/products`, `/cart`, `/seller/orders` ...). | Navigation without full page reloads, giving a smooth single-page app (SPA) feel. Supports nested routes for the seller dashboard. |
| **Context API** | built in | Global state: user, cart, products, search. | The app's global state is small. Context avoids adding Redux and its boilerplate while still avoiding prop-drilling. |
| **Axios** | 1.x | HTTP calls to the backend. | Cleaner than `fetch`: automatic JSON handling, global defaults (`baseURL`, `withCredentials`) and interceptors for central error handling. |
| **Tailwind CSS** | 4 | All styling. | Utility classes mean no separate CSS files per component, and responsive design is easy (`md:`, `lg:` prefixes). v4 plugs straight into Vite. |
| **react-hot-toast** | 2.x | Pop-up notifications. | Tiny, good-looking, one-line API (`toast.success("...")`). |
| **lucide-react** | 0.5x | Icons (e.g. the trash icon). | Clean SVG icon set; you import only the icons you use. |
| **ESLint** | 9 | Code quality checks. | Catches bugs early, such as unused variables or wrong hook dependencies. |

### 3.2 Backend

| Technology | Version | What it does here | Why it was chosen |
|---|---|---|---|
| **Node.js** | 18+ | JavaScript runtime for the server. | The same language on frontend and backend (JavaScript everywhere). Non-blocking I/O is well suited to an API that mostly waits on the database and network. |
| **Express** | 5 | Web framework: routes, middleware. | Minimal and very popular. Express 5 forwards errors from async handlers automatically. |
| **MongoDB** | Atlas | Database. | Document model fits e-commerce data well (a product with an array of images, a cart as a key/value object). Atlas offers a free hosted tier. |
| **Mongoose** | 8 | ODM (Object Data Modeling) for MongoDB. | Adds schemas, validation and `populate()` (join-like lookups) on top of schemaless MongoDB. |
| **jsonwebtoken (JWT)** | 9 | Creates and verifies login tokens. | Stateless auth: the server doesn't store sessions; it just verifies the token's signature. Works well on serverless platforms. |
| **bcryptjs** | 3 | Hashes passwords. | Slow, salted hashing that resists brute force. The pure-JS version needs no native build, so it deploys easily to Vercel. |
| **cookie-parser** | 1.4 | Reads cookies into `req.cookies`. | The JWT lives in a cookie, so the server must read it. |
| **cors** | 2.8 | Allows the frontend domain to call the API. | Frontend and backend are on different domains, so browsers block requests without CORS headers. `credentials: true` lets cookies travel. |
| **dotenv** | 17 | Loads `.env` into `process.env`. | Keeps secrets out of the code and out of Git. |
| **Multer** | 2 | Handles `multipart/form-data` file uploads. | Express can't parse file uploads on its own; Multer saves them to a temporary folder. |
| **Cloudinary** | 2 | Cloud image storage and CDN. | Vercel servers have no permanent disk, so images must live elsewhere. Cloudinary hosts them, serves them fast worldwide and returns a URL. |
| **Stripe** | 18 | Online card payments. | Industry standard. Stripe Checkout is a hosted payment page, so card data never touches our server (keeps PCI compliance simple). |
| **nodemon** | 3 | Restarts the server on file changes (dev only). | Faster development. |

### 3.3 Hosting

| Service | Used for | Why |
|---|---|---|
| **Vercel** | Hosting both frontend and backend. | Free tier, deploys on every Git push, global CDN for the React build, and runs Express as a serverless function. |
| **MongoDB Atlas** | Hosted database. | Free M0 cluster, managed backups, accessible from anywhere. |
| **Cloudinary** | Image hosting. | Free tier, automatic optimization. |
| **Stripe** | Payments. | Test mode for development, real payments in production. |

### 3.4 Why the MERN stack as a whole?
1. **One language (JavaScript) everywhere:** fewer context switches, and code and knowledge can be shared.
2. **JSON end to end:** MongoDB stores documents that look like JSON, Express sends JSON, and React consumes JSON. No translation layers.
3. **Huge community:** a library exists for almost every problem.
4. **Free to host** for a project of this size.

---

## 4. System Architecture

```
                         ┌───────────────────────────────┐
                         │          BROWSER              │
                         │  React SPA (Vite build)       │
                         │  - AppContext (global state)  │
                         │  - React Router pages         │
                         └──────────────┬────────────────┘
                                        │ HTTPS (Axios)
                                        │ cookies: token / sellerToken
                                        ▼
┌──────────────────────────────────────────────────────────────────┐
│                     EXPRESS API  (Vercel serverless)             │
│                                                                  │
│  /stripe (raw body) ──► stripeWebhooks                           │
│                                                                  │
│  express.json → cookieParser → cors → DB-check middleware        │
│                                                                  │
│  /api/user     → userController     (register/login/logout)      │
│  /api/seller   → sellerController   (login/logout/is-auth)       │
│  /api/product  → productController  (add/list/stock/delete)      │
│  /api/cart     → cartController     (update)                     │
│  /api/address  → addressController  (add/get)                    │
│  /api/order    → orderController    (cod/stripe/user/seller)     │
│                                                                  │
│  Middlewares: authUser (token)  authSeller (sellerToken)         │
└───────┬──────────────────────┬──────────────────────┬────────────┘
        │                      │                      │
        ▼                      ▼                      ▼
┌──────────────┐      ┌────────────────┐     ┌──────────────────┐
│ MongoDB Atlas│      │   Cloudinary   │     │      Stripe      │
│ users        │      │ product images │     │ Checkout + Webhook│
│ products     │      └────────────────┘     └──────────────────┘
│ addresses    │
│ orders       │
└──────────────┘
```

### Request lifecycle example: "Customer adds an item to the cart"
1. The user clicks **Add** on a `ProductCard`.
2. `addToCart(id)` in `AppContext` copies the cart, increments the item and calls `setCartItems`.
3. A `useEffect` watching `cartItems` fires and sends `POST /api/cart/update` with the whole cart.
4. Axios sends the `token` cookie automatically (`withCredentials: true`).
5. On the server, `authUser` verifies the JWT and sets `req.userId`.
6. `updateCart` cleans the cart (only valid ids and positive whole-number quantities) and saves it to the `User` document.
7. The navbar badge updates instantly, because `getCartCount()` reads the same context state.

---

## 5. Folder Structure (Every File Explained)

```
FoodBasket/
├── README.md                 Project overview
├── learning.md               This file
├── .gitignore                Ignores node_modules, .env, dist, logs
│
├── client/                   ── FRONTEND (React + Vite) ──
│   ├── index.html            Single HTML page; React mounts into <div id="root">
│   ├── vite.config.js        Vite plugins: React + Tailwind
│   ├── eslint.config.js      Lint rules (React hooks, fast refresh)
│   ├── vercel.json           Rewrites every URL to "/" so React Router handles routing
│   ├── package.json          Frontend dependencies and scripts (dev/build/lint/preview)
│   ├── public/favicon.svg    Browser tab icon
│   └── src/
│       ├── main.jsx          Entry point: BrowserRouter → AppContextProvider → App
│       ├── App.jsx           All routes, Navbar/Footer, Login modal, Toaster
│       ├── index.css         Tailwind import, Outfit font, theme colors
│       ├── assets/assets.js  Image imports, categories, footer links, features
│       ├── context/
│       │   └── AppContext.jsx    Global state + all shared functions
│       ├── components/
│       │   ├── Navbar.jsx        Logo, links, search, cart badge, profile menu
│       │   ├── Footer.jsx        Footer links + copyright
│       │   ├── Login.jsx         Login/Register modal
│       │   ├── MainBanner.jsx    Hero banner with "Shop now"
│       │   ├── Categories.jsx    7 category tiles
│       │   ├── BestSeller.jsx    First 5 in-stock products
│       │   ├── BottomBanner.jsx  "Why We Are the Best?" features
│       │   ├── NewsLetter.jsx    Email subscribe box
│       │   ├── ProductCard.jsx   Reusable product tile with +/- cart controls
│       │   ├── Loading.jsx       Spinner shown after Stripe payment, then redirects
│       │   └── seller/SellerLogin.jsx  Seller login form
│       └── pages/
│           ├── Home.jsx            Combines the home sections
│           ├── AllProducts.jsx     All in-stock products, filtered by search
│           ├── ProductCategory.jsx Products of one category
│           ├── ProductDetails.jsx  Single product view + related products
│           ├── Cart.jsx            Cart, address, payment, order placement
│           ├── AddAddress.jsx      New address form
│           ├── MyOrders.jsx        Customer order history
│           └── seller/
│               ├── SellerLayout.jsx  Dashboard shell (top bar + sidebar + <Outlet/>)
│               ├── AddProduct.jsx    Product creation form with image upload
│               ├── ProductList.jsx   Product table, stock toggle, delete modal
│               └── Orders.jsx        All orders for the seller
│
└── server/                   ── BACKEND (Node + Express) ──
    ├── server.js             App setup: DB, Cloudinary, middleware, routes, export
    ├── vercel.json           Tells Vercel to run server.js with @vercel/node
    ├── package.json          Backend dependencies and scripts (start/server/dev)
    ├── configs/
    │   ├── db.js             MongoDB connection (reused, retried, fail-fast)
    │   ├── cloudinary.js     Cloudinary credentials setup
    │   ├── multer.js         Multer disk storage for temporary uploads
    │   └── cookie.js         Shared cookie options (httpOnly/secure/sameSite)
    ├── middlewares/
    │   ├── authUser.js       Verifies customer JWT → req.userId
    │   └── authSeller.js     Verifies seller JWT + email match
    ├── models/
    │   ├── User.js           name, email, password(hash), cartItems
    │   ├── Product.js        name, description[], price, offerPrice, image[], category, inStock
    │   ├── Address.js        userId + full shipping address
    │   └── Order.js          userId, items[], amount, address, status, paymentType, isPaid, paidAt
    ├── controllers/
    │   ├── userController.js     register, login, isAuth, logout
    │   ├── sellerController.js   sellerLogin, isSellerAuth, sellerLogout
    │   ├── productController.js  addProduct, productList, productById, changeStock, deleteProduct
    │   ├── cartController.js     updateCart
    │   ├── addressController.js  addAddress, getAddress
    │   └── orderController.js    placeOrderCOD, placeOrderStripe, stripeWebhooks, getUserOrders, getAllOrders
    └── routes/
        ├── userRoute.js, sellerRoute.js, productRoute.js,
        └── cartRoute.js, addressRoute.js, orderRoute.js
```

**Pattern used:** **MVC-style layering** on the backend.
- **Routes** say *which URL* calls *which function*, and which middleware guards it.
- **Controllers** contain the *business logic*.
- **Models** define the *data shape*.
- **Middlewares** handle *cross-cutting concerns* such as auth.

This separation keeps each file small, testable and easy to find.

---

## 6. Environment Variables

### `server/.env`
| Variable | Purpose |
|---|---|
| `JWT_SECRET` | Secret key used to sign and verify JWTs. Must be long and random. |
| `NODE_ENV` | `development` locally, `production` on Vercel. Controls cookie security flags. |
| `SELLER_EMAIL` | The single admin's email. |
| `SELLER_PASSWORD` | The single admin's password. |
| `MONGODB_URI` | MongoDB Atlas connection string (includes the `/foodbasket` database name). |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Cloudinary credentials. |
| `STRIPE_PUBLISHABLE_KEY` | Stripe public key (kept for reference; Checkout is created server-side). |
| `STRIPE_SECRET_KEY` | Stripe secret key used to create Checkout sessions. |
| `STRIPE_WEBHOOK_SECRET` | Verifies that webhook calls really come from Stripe. |
| `FRONTEND_URL` *(optional)* | Fallback return URL for Stripe if the request has no `Origin` header. |

### `client/.env` (development) and `client/.env.production`
| Variable | Purpose |
|---|---|
| `VITE_BACKEND_URL` | API base URL (`http://localhost:4000` locally, the Vercel backend URL in production). |
| `VITE_CURRENCY` | Currency symbol shown in the UI (`₹`). |

**Why the `VITE_` prefix?** Vite only exposes variables that start with `VITE_` to browser code. This protects server secrets from accidentally being bundled into the public JavaScript.

**Why are `.env` files in `.gitignore`?** Secrets must never be pushed to GitHub. On Vercel they are entered in *Project → Settings → Environment Variables*.

---

## 7. Backend Deep Dive

### 7.1 `server.js`: the heart of the API

The order of setup matters:

```js
import "dotenv/config";            // 1. Load env vars FIRST
...
await connectDB();                 // 2. Connect MongoDB (top-level await, ES modules)
await connectCloudinary();         // 3. Configure Cloudinary

app.post("/stripe", express.raw({ type: "application/json" }), stripeWebhooks); // 4. BEFORE json parser

app.use(express.json());           // 5. Parse JSON bodies
app.use(cookieParser());           // 6. Parse cookies
app.use(cors({ origin: true, credentials: true }));  // 7. Allow cross-origin requests with cookies

app.use("/api", dbCheckMiddleware);// 8. Fail fast (503) if the DB is unreachable
app.use("/api/user", userRouter);  // 9. Mount routers
...
if (!process.env.VERCEL) app.listen(port);   // 10. Local server only
export default app;                          // 11. Vercel imports the app
```

**Key decisions explained:**
- **`dotenv/config` is imported first** so every later module (like Stripe setup) sees the env vars.
- **The Stripe webhook is registered before `express.json()`.** Stripe signs the *exact raw bytes* of the request. If `express.json()` parsed the body first, the bytes would change and signature verification would fail.
- **`"type": "module"`** in `package.json` enables `import`/`export` syntax and top-level `await`.
- **`export default app`**: on Vercel there is no long-running server. Each request invokes the exported app as a function.
- **DB-check middleware:** if MongoDB is down, the API answers instantly with a clear 503 message instead of hanging.

### 7.2 `configs/db.js`
- `mongoose.set("bufferCommands", false)` stops Mongoose from silently queueing queries for 10 s when there is no connection.
- It **reuses the connection** if already connected (`readyState === 1`). This matters on serverless, where warm instances keep their connection between requests.
- Concurrent callers share **one in-flight connection promise** (`connecting`), so a burst of requests doesn't open many connections.
- `serverSelectionTimeoutMS: 5000` makes failures quick.

### 7.3 `configs/cookie.js`
```js
{ httpOnly: true, secure: isProduction(), sameSite: isProduction() ? "none" : "strict" }
```
- `httpOnly`: JavaScript in the browser cannot read the cookie, which protects against token theft through XSS.
- `secure`: the cookie is sent only over HTTPS in production.
- `sameSite: "none"` in production: frontend and backend are on *different* domains, so the cookie must be allowed cross-site. Browsers require `secure` whenever `sameSite` is `none`.
- `sameSite: "strict"` in development: `localhost:5173` and `localhost:4000` count as the same site, so the strictest setting works.
- One shared helper ensures `clearCookie` uses **identical options** to `cookie`, which browsers require for logout to work.

### 7.4 Controllers: summary of logic

**userController**
- `register`: validate the fields (password ≥ 6 chars) → check for a duplicate email → `bcrypt.hash(password, 10)` → create the user → sign a JWT `{ id }` → set the cookie → return the user (without the password).
- `login`: find by email → `bcrypt.compare` → sign the JWT → set the cookie. The error message is deliberately generic ("Invalid email or password") so attackers can't find out which emails are registered.
- `isAuth`: return the user (without the password) for the id taken from the token. The frontend calls this on page load to restore the session.
- `logout`: clear the cookie. It doesn't require a valid token, so logout works even if the token has expired.

**sellerController**
- The seller is a **single admin** whose credentials live in env vars, so no seller table is needed. It signs a JWT `{ email }` into a separate `sellerToken` cookie.

**productController**
- `addProduct`: validates the name, category (one of the 7), positive prices and offer ≤ price → uploads every image to Cloudinary in parallel (`Promise.all`) → saves the product with the image URLs → deletes temp files in `finally`.
- `productList`: returns all products, newest first.
- `productById`: validates the ObjectId, then returns the product.
- `changeStock`: sets `inStock` (must be a boolean).
- `deleteProduct`: `findByIdAndDelete`.

**cartController**
- `updateCart`: keeps only entries whose key is a valid ObjectId and whose quantity is a positive whole number, then saves them to `user.cartItems`.

**addressController**
- `addAddress`: strips any client-sent `_id` or `userId` and always uses `req.userId` from the token, so a user can't create addresses for someone else.
- `getAddress`: returns only the current user's addresses.

**orderController**: explained in detail in [Section 12](#12-orders-and-payments-cod--stripe).

---

## 8. Database Models

### User
```js
{ name: String (required),
  email: String (required, unique),
  password: String (required, bcrypt hash),
  cartItems: Object (default {}) }        // { "<productId>": quantity }
// option: { minimize: false }
```
**Why `minimize: false`?** Mongoose normally drops empty objects when saving. Without this option, a new user's empty `cartItems: {}` would not be stored at all, and the frontend would have to handle `undefined`.

**Why store the cart as an object rather than an array?** Looking up or updating a product's quantity is O(1) (`cart[id] += 1`) and there can never be duplicate entries.

### Product
```js
{ name: String, description: Array, price: Number, offerPrice: Number,
  image: Array, category: String, inStock: Boolean (default true) }
// timestamps: createdAt, updatedAt
```
- `description` is an **array** of lines, shown as bullet points on the product page.
- `price` is the MRP and `offerPrice` is the selling price, so the UI can show a struck-through MRP.

### Address
```js
{ userId, firstName, lastName, email, street, city, state,
  zipcode: String, country, phone }
```
`zipcode` is a **String** because postal codes can start with 0 and are never used in arithmetic.

### Order
```js
{ userId (ref 'user'),
  items: [{ product (ref 'product'), quantity }],
  amount: Number,              // calculated on the SERVER
  address (ref 'address'),
  status: String (default 'Order Placed'),
  paymentType: 'COD' | 'Online',
  isPaid: Boolean (default false),
  paidAt: Date }
// timestamps
```
- **`ref` + `populate()`**: the order stores only ids. When reading, `.populate("items.product")` and `.populate("address")` swap the ids for the full documents, much like a SQL JOIN.
- **Why store ids instead of copying data?** It keeps a single source of truth and keeps documents small. (A production shop might *also* snapshot the price at order time; here `amount` already stores the final total.)

### Relationships diagram
```
User 1 ──── * Address
User 1 ──── * Order * ──── 1 Address
Order 1 ──── * items ──── 1 Product
User.cartItems  { productId: qty }  → Product
```

---

## 9. API Reference

All responses use the shape `{ success: boolean, message?: string, ...data }`.

### User: `/api/user`
| Method | Endpoint | Auth | Body | Returns |
|---|---|---|---|---|
| POST | `/register` | none | `{ name, email, password }` | `{ success, user }` + sets `token` cookie |
| POST | `/login` | none | `{ email, password }` | `{ success, user }` + sets `token` cookie |
| GET | `/is-auth` | user | none | `{ success, user }` |
| GET | `/logout` | none | none | clears the cookie |

### Seller: `/api/seller`
| Method | Endpoint | Auth | Body |
|---|---|---|---|
| POST | `/login` | none | `{ email, password }` → sets `sellerToken` |
| GET | `/is-auth` | seller | none |
| GET | `/logout` | none | none |

### Product: `/api/product`
| Method | Endpoint | Auth | Body |
|---|---|---|---|
| POST | `/add` | seller | `multipart/form-data`: `productData` (JSON string) + `images` (≤ 4 files) |
| GET | `/list` | none | none |
| GET | `/id/:id` | none | none |
| POST | `/stock` | seller | `{ id, inStock }` |
| DELETE | `/delete/:id` | seller | none |

### Cart: `/api/cart`
| POST | `/update` | user | `{ cartItems: { productId: qty } }` |
|---|---|---|---|

### Address: `/api/address`
| Method | Endpoint | Auth | Body |
|---|---|---|---|
| POST | `/add` | user | `{ address: {...} }` |
| GET | `/get` | user | none |

### Order: `/api/order`
| Method | Endpoint | Auth | Body |
|---|---|---|---|
| POST | `/cod` | user | `{ items: [{product, quantity}], address }` |
| POST | `/stripe` | user | same → returns `{ url }` (Stripe Checkout page) |
| GET | `/user` | user | none → the customer's orders |
| GET | `/seller` | seller | none → all COD orders + all paid online orders |

### Webhook
| POST | `/stripe` | Stripe signature | raw JSON from Stripe |
|---|---|---|---|

---

## 10. Authentication and Authorization

### Customer login flow
```
Browser                          Server                          MongoDB
  │ POST /api/user/login ─────────►│                                │
  │   {email,password}             │ findOne({email}) ─────────────►│
  │                                │◄──────────────── user (hash)   │
  │                                │ bcrypt.compare(pw, hash) ✔     │
  │                                │ jwt.sign({id}, SECRET, 7d)     │
  │◄── Set-Cookie: token=JWT; HttpOnly; Secure; SameSite=None ──────│
  │                                                                 │
  │ GET /api/user/is-auth (cookie sent automatically)               │
  │ ──────────────────────────────►│ authUser: jwt.verify → req.userId
  │◄────────────── { user }        │                                │
```

### Why JWT in an HTTP-only cookie (not localStorage)?
| Option | Risk |
|---|---|
| `localStorage` | Any JavaScript, including an XSS-injected script, can read the token and steal the session. |
| **HTTP-only cookie** ✅ | JavaScript cannot read it. The browser attaches it automatically. |

The trade-off is that cookies can be abused through CSRF. That risk is reduced by the `SameSite` setting and by only reading JSON bodies.

### Middlewares
- **`authUser`**: reads `req.cookies.token` → `jwt.verify` → sets `req.userId` → `next()`. On failure it returns `{ success:false, message:"Not Authorized" }`.
- **`authSeller`**: reads `req.cookies.sellerToken` → verifies it **and** checks that `email === SELLER_EMAIL`.

**Why two separate cookies?** A customer token can never unlock seller routes, and someone can be logged in as both at the same time for testing.

**Why the userId comes from the token and not the body:** clients can send anything in the body. Taking the id from a signed token means a user can only ever act as themselves.

---

## 11. Cart System

The cart is the most interesting piece of state, because it lives in **two places**: React state and MongoDB.

### Shape
```js
cartItems = { "665f...a1": 2, "665f...b7": 1 }   // productId → quantity
```

### Functions in `AppContext`
| Function | What it does |
|---|---|
| `addToCart(id)` | +1 (creates the item at 1 if missing). |
| `removeFromCart(id)` | −1; deletes the key at 0. |
| `updateCartItem(id, qty)` | Sets an exact quantity; `0` removes the item (used by the cart's quantity dropdown and its remove icon). |
| `getCartCount()` | Total number of units (navbar badge). |
| `getCartAmount()` | Σ offerPrice × qty, rounded to 2 decimals. |

All updates use **`structuredClone`** to copy the cart before changing it. React detects changes by reference, so mutating the existing object would not trigger a re-render.

### Syncing to the server
```js
useEffect(() => {
  if (skipNextSync.current) { skipNextSync.current = false; return; }
  if (!user) return;
  axios.post("/api/cart/update", { cartItems });
}, [cartItems, user]);
```
- **Guests** keep the cart in memory only.
- **Logged-in users** have every change saved automatically.
- **`skipNextSync`**: when the cart has *just been loaded from* the server, there is no point sending it straight back. A `useRef` flag skips that one sync without causing a re-render.

### Guest-to-user cart merge
When a guest logs in, `loginUser()` merges the guest cart with the saved server cart, taking the **larger quantity** for each product. Nothing the customer picked is lost.

### Stale items
If the seller deletes a product, a `useEffect` removes that id from any cart once the product list loads.

---

## 12. Orders and Payments (COD + Stripe)

### 12.1 Golden rule: **never trust prices from the client**
The client sends only `{ product id, quantity }` and an address id. The server:
1. Checks that the address belongs to this user.
2. For each item, checks the ObjectId, that the quantity is a positive whole number, that the product exists and that it is in stock.
3. Reads `offerPrice` **from the database**.
4. `tax = Math.floor(subtotal × 0.02)` and `amount = subtotal + tax`.

This logic lives in one shared helper, `buildOrder()`, used by both COD and Stripe, so the two flows can't drift apart.

### 12.2 Cash on Delivery
```
Cart → POST /api/order/cod → buildOrder() → Order.create({paymentType:"COD", isPaid:false})
     → clear user.cartItems → { success } → frontend clears cart → /my-orders
```

### 12.3 Online payment with Stripe Checkout
```
1. Cart → POST /api/order/stripe
2. Server: buildOrder() → Order.create({paymentType:"Online", isPaid:false})
3. Server: stripe.checkout.sessions.create({
       line_items: [... each product in paise (₹ × 100) ..., Tax line],
       success_url: <origin>/loader?next=my-orders,
       cancel_url:  <origin>/cart,
       metadata: { orderId, userId } })
4. Server → { url } ; Browser → window.location.replace(url)  (Stripe's hosted page)
5. Customer pays on Stripe
6. Stripe → POST /stripe (webhook, signed)  → checkout.session.completed
       → Order.isPaid = true, paidAt = now ; user.cartItems = {}
7. Stripe redirects browser → /loader?next=my-orders
       → Loading page clears the local cart → after 5 s → /my-orders
```

**Why amounts × 100?** Stripe works in the **smallest currency unit** (paise for INR) to avoid floating-point money errors. `Math.round` is used because, for example, `19.99 × 100 = 1998.9999…` in floating point.

**Why a webhook instead of trusting the success_url?** Anyone could open `/loader?next=my-orders` in a browser. Only Stripe can produce a correctly **signed** webhook (`stripe.webhooks.constructEvent` with `STRIPE_WEBHOOK_SECRET`), so it is the only trustworthy proof of payment. It also works if the user closes the tab before the redirect.

**Why `metadata.orderId`?** It links the Stripe session back to *our* order, so the webhook knows which order to mark as paid.

**Abandoned checkouts:** the `checkout.session.expired` event deletes the order if it is still unpaid. A single failed card attempt is *not* treated as final, because the customer can retry within the same session.

**Visibility:**
- The **seller** sees COD orders plus *paid* online orders only.
- The **customer** sees all their orders, with a *Paid* or *Pending* badge.

---

## 13. Image Uploads (Multer + Cloudinary)

```
AddProduct form ──FormData──► POST /api/product/add
   productData: '{"name":...}'       │
   images: File, File...             ▼
                       authSeller (check login FIRST)
                                     ▼
                       multer.array("images", 4)  → temp files on disk, req.files
                                     ▼
                       cloudinary.uploader.upload(file.path) × N  (Promise.all, parallel)
                                     ▼
                       Product.create({ ..., image: [secure_url, ...] })
                                     ▼
                       finally: delete temp files
```
**Why `FormData`?** Files can't be sent inside JSON. `multipart/form-data` carries both files and text, so the product's text fields travel as one JSON string field (`productData`).

**Why authenticate before Multer?** Otherwise anyone could upload files to the server before being rejected.

**Why `Promise.all`?** The 4 uploads run in parallel instead of one after another, which is about 4× faster.

---

## 14. Frontend Deep Dive

### 14.1 Bootstrapping (`main.jsx`)
```jsx
<StrictMode>
  <BrowserRouter>            // routing must wrap the context (the context uses useNavigate)
    <AppContextProvider>     // global state available everywhere
      <App />
```
`axios.defaults.withCredentials = true` makes **every** request send cookies, and `baseURL` points at the backend.

### 14.2 Routing (`App.jsx`)
| Path | Component |
|---|---|
| `/` | Home |
| `/products` | AllProducts |
| `/products/:category` | ProductCategory |
| `/products/:category/:id` | ProductDetails |
| `/cart` | Cart |
| `/add-address` | AddAddress |
| `/my-orders` | MyOrders |
| `/loader` | Loading (post-payment) |
| `/seller` | `isSeller ? <SellerLayout/> : <SellerLogin/>` |
| `/seller` (index) | AddProduct |
| `/seller/product-list` | ProductList |
| `/seller/orders` | Orders |

- **Nested routes:** `SellerLayout` renders the sidebar once and an `<Outlet/>` where the child page appears.
- **Route guarding:** if `isSeller` is false, the `/seller` route renders the login form instead of the dashboard.
- **`isSellerPath`** (`pathname.startsWith("/seller")`) hides the customer Navbar and Footer inside the dashboard.

### 14.3 Global state (`AppContext.jsx`)
| State | Purpose |
|---|---|
| `user`, `isUserLoading` | Logged-in customer, and whether the auth check is still running. |
| `isSeller` | Seller session flag. |
| `showUserLogin` | Opens the Login modal from anywhere. |
| `products` | All products, fetched once on load. |
| `cartItems` | The cart. |
| `searchQuery` | Text typed in the navbar search. |
| `currency` | From `VITE_CURRENCY`. |

On first load it runs **`fetchSeller()`, `fetchProducts()` and `fetchUser()`** in parallel.

**Why `isUserLoading`?** Without it, pages like *Add Address* would see `user === null` during the first few milliseconds and wrongly redirect a logged-in user.

**Axios interceptor:** turns server error responses into readable toasts (e.g. "Database is unavailable right now") instead of "Request failed with status code 503".

### 14.4 Key components
- **`ProductCard`**: shows the image, category, name, stars, offer price and struck-through MRP. Shows "Add" when the item is not in the cart, and a `− qty +` counter when it is. `e.stopPropagation()` stops a cart-button click from also opening the product page.
- **`Navbar`**: search input bound to `searchQuery`. Typing jumps to `/products`, where the list filters live. The cart badge shows `getCartCount()`. The profile menu has *My Orders* and *Logout*. There is a responsive mobile menu.
- **`Login`**: one modal that switches between login and register. Clicking the dark overlay closes it, and `stopPropagation` on the form stops clicks inside from closing it. The button is disabled while the request runs, to prevent double submits.
- **`Loading`**: after Stripe, it clears the local cart, waits 5 s (giving the webhook time) and redirects. Only internal paths are allowed in `next`, which prevents open redirects.

### 14.5 Key pages
- **`AllProducts`**: filters `products` by `searchQuery` (case-insensitive) and shows only in-stock items.
- **`ProductDetails`**: finds the product by `:id`, computes related products with `useMemo` (same category, not itself, in stock), keeps a thumbnail gallery in state, and hides the buy buttons when the product is out of stock.
- **`Cart`**: builds `cartArray` by joining `cartItems` with `products`, loads addresses when logged in, and shows subtotal, tax and total using the **same formula as the server**. "Place Order" is locked while placing an order.
- **`AddProduct`**: four image slots with live previews (`URL.createObjectURL`). Description lines are split into an array. It validates that prices are > 0 and that the offer ≤ price.
- **`ProductList`**: the stock toggle is a hidden checkbox styled as a switch (`peer` + `peer-checked:` Tailwind classes). Delete opens a confirmation modal.

---

## 15. Styling with Tailwind CSS v4

- Set up through the **`@tailwindcss/vite` plugin**. In v4 there is no `tailwind.config.js`; `@import "tailwindcss";` in `index.css` is enough.
- **Custom theme colors** are defined with the new `@theme` directive:
  ```css
  @theme { --color-primary: #4fbf8b; --color-primary-dull: #44ae7c; }
  ```
  This automatically creates classes like `bg-primary`, `text-primary`, `hover:bg-primary-dull` and `bg-primary/10` (10% opacity).
- **Font:** Outfit, from Google Fonts.
- **Responsive design:** mobile-first, with `sm:`, `md:`, `lg:` and `xl:` prefixes. For example `grid-cols-2 md:grid-cols-4 lg:grid-cols-5` shows 2 products per row on phones and 5 on desktops.
- **`.no-scrollbar`**: hides scrollbars in the seller panels.

**Why utility-first CSS?** Styles sit right next to the markup, with no naming debates and no unused CSS (Tailwind ships only the classes you use), and every page shares the same design scale.

---

## 16. Security Measures

| Threat | Protection in FoodBasket |
|---|---|
| Password leaks | bcrypt hashes with salt (cost 10); the password is never returned (`.select("-password")`). |
| Token theft through XSS | JWT in an **HTTP-only** cookie. |
| Cookie interception | `secure: true` (HTTPS only) in production. |
| CSRF | `SameSite` cookie policy; JSON-only API. |
| Price tampering | Totals are recalculated on the server from database prices. |
| Fake payment confirmation | Signed Stripe webhook verified with `constructEvent`. |
| Acting as another user | `userId` always comes from the verified token, never from the body; address ownership is checked. |
| Bad input | ObjectId validation, positive whole-number quantities, category allow-list, price checks. |
| Customer accessing admin routes | Separate `sellerToken` plus an email check in `authSeller`. |
| Unauthenticated uploads | `authSeller` runs before Multer; max 4 files; temp files deleted. |
| Leaked secrets | `.env` is git-ignored; Vercel env vars are used in production. |
| User enumeration | Generic "Invalid email or password" message. |
| Open redirect | The `/loader?next=` value is restricted to internal paths. |
| Card data exposure | Stripe-hosted Checkout, so card data never touches our server. |

---

## 17. Deployment on Vercel

The project is deployed as **two Vercel projects** from the same repository.

### Backend (`server/`)
`server/vercel.json`:
```json
{ "version": 2,
  "builds": [{ "src": "server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "server.js" }] }
```
- `@vercel/node` turns `server.js` into a **serverless function**.
- The `routes` rule sends **every** URL to that function, and Express routes it from there.
- The env vars (`MONGODB_URI`, `JWT_SECRET`, Stripe, Cloudinary, seller credentials, `NODE_ENV=production`) are added in the Vercel dashboard.
- The Stripe webhook endpoint is configured in the Stripe dashboard as `https://<backend>.vercel.app/stripe`, listening for `checkout.session.completed` and `checkout.session.expired`.
- In MongoDB Atlas, Network Access allows `0.0.0.0/0`, because Vercel's IP addresses change.

### Frontend (`client/`)
`client/vercel.json`:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
```
**Why the rewrite?** The app is an SPA, so there is no real `/cart.html` file. Without the rewrite, refreshing `/cart` would return a 404. With it, every path serves `index.html` and React Router shows the right page.

- Build command: `npm run build` (Vite) → output folder `dist/`.
- Env vars: `VITE_BACKEND_URL=https://<backend>.vercel.app`, `VITE_CURRENCY=₹`.

### Why serverless suits this app
- **Scales to zero:** it costs nothing when idle.
- **Scales up automatically** when traffic spikes.
- **No server maintenance.**

The trade-offs are **cold starts** and **no permanent disk**. That's why images go to Cloudinary, and why the DB connection is reused between warm invocations.

---

## 18. Running the Project Locally

```bash
# 1. Clone
git clone <repo-url> && cd FoodBasket

# 2. Backend
cd server
npm install
# create server/.env with the variables from Section 6
npm run server        # nodemon → http://localhost:4000

# 3. Frontend (new terminal)
cd client
npm install
# create client/.env with VITE_BACKEND_URL=http://localhost:4000 and VITE_CURRENCY=₹
npm run dev           # → http://localhost:5173

# 4. (Optional) Stripe webhooks locally
stripe listen --forward-to localhost:4000/stripe
```

**First steps in the app:**
1. Open `http://localhost:5173/seller` and log in with `SELLER_EMAIL` / `SELLER_PASSWORD`.
2. Add a few products.
3. Go to `/` and register as a customer.
4. Add items to the cart, add an address and place an order.
5. For Stripe test payments, use card `4242 4242 4242 4242`, any future date and any CVC.

Other scripts: `npm run lint` (ESLint), `npm run build` and `npm run preview` (test the production build).

---

## 19. Seven-Day Build Plan (Day 1 to Day 7)

### 📅 Day 1: Planning, setup and the static UI shell
**Goal:** a running React app with the layout and home page.
1. Plan the features, the two roles (customer/seller) and the 7 categories, and sketch the pages.
2. Create the repo with `client/` and `server/` folders, and add `.gitignore`.
3. `npm create vite@latest client` with the React template.
4. Install `react-router-dom`, `tailwindcss`, `@tailwindcss/vite` and `react-hot-toast`.
5. Configure Tailwind in `vite.config.js` and `index.css`; add the `@theme` primary colors and the Outfit font.
6. Collect images and icons into `src/assets/` and build `assets.js` (images, `categories`, `footerLinks`, `features`, and `dummyProducts` for development).
7. Set up `main.jsx` with `BrowserRouter`, and a basic `App.jsx` with routes.
8. Build the **Navbar** (desktop + mobile menu) and **Footer**.
9. Build the home sections: **MainBanner, Categories, BestSeller, BottomBanner, NewsLetter**.

✅ *End of day: a good-looking static home page.*

### 📅 Day 2: Global state, product pages and a client-only cart
**Goal:** every customer page working with dummy data.
1. Create **`AppContext`** with `user`, `products`, `cartItems`, `searchQuery`, `showUserLogin` and `currency`.
2. Write `addToCart`, `removeFromCart`, `updateCartItem`, `getCartCount` and `getCartAmount`.
3. Build the reusable **`ProductCard`** with Add / − qty + controls.
4. Build **AllProducts** (with search filtering), **ProductCategory** (`useParams`) and **ProductDetails** (gallery, related products).
5. Build the **Cart** page UI: item list, quantity dropdown, order summary, address and payment pickers.
6. Build the **Login** modal UI and the **AddAddress** and **MyOrders** pages using dummy data.

✅ *End of day: a fully clickable frontend prototype, with no backend yet.*

### 📅 Day 3: Backend foundation and authentication
**Goal:** a running API with customer and seller auth.
1. `npm init` in `server/`, set `"type": "module"`, and install `express mongoose dotenv cors cookie-parser jsonwebtoken bcryptjs` plus `nodemon`.
2. Create a MongoDB Atlas cluster, a DB user and a network rule; put `MONGODB_URI` in `.env`.
3. Write `configs/db.js` and `server.js` (middleware order, health route `/`).
4. Create the **User model**.
5. Write `userController` (register/login/isAuth/logout), `configs/cookie.js` and the **`authUser`** middleware.
6. Write the seller login with env credentials, plus the **`authSeller`** middleware.
7. Test every endpoint with Postman or Thunder Client.

✅ *End of day: register, login, persistent sessions and seller login all working through the API.*

### 📅 Day 4: Products, image uploads and the seller dashboard
**Goal:** the seller can manage the catalogue for real.
1. Create the **Product model**.
2. Set up a **Cloudinary** account and `configs/cloudinary.js`; set up `configs/multer.js`.
3. Write `productController`: add (with Cloudinary upload), list, by id, change stock, delete.
4. Write the product routes, protecting the write routes with `authSeller`.
5. Frontend: build **SellerLogin**, **SellerLayout** (sidebar + `<Outlet/>`), **AddProduct** (`FormData`, image previews) and **ProductList** (stock switch, delete modal).
6. Add nested `/seller` routes to `App.jsx` and guard them with `isSeller`.

✅ *End of day: products created in the dashboard appear in MongoDB, with images on Cloudinary.*

### 📅 Day 5: Connecting the storefront: real data, auth, cart and addresses
**Goal:** replace all dummy data with the API.
1. Install **Axios**; set `withCredentials` and `baseURL` from `VITE_BACKEND_URL`.
2. In the context, add `fetchProducts`, `fetchUser` and `fetchSeller` on load, plus the `isUserLoading` flag.
3. Connect the **Login** modal (register/login), the Navbar **logout** and the seller logout.
4. Backend: write `cartController.updateCart`. Frontend: add the `useEffect` that syncs the cart, `skipNextSync`, the guest-cart merge on login and the stale-item cleanup.
5. Backend: create the **Address model** and controller (add/get). Connect the **AddAddress** page and the Cart's address picker.
6. Add toasts for every success and error.

✅ *End of day: a real store. Browse, log in, the cart is saved, addresses are saved.*

### 📅 Day 6: Orders and payments
**Goal:** checkout end to end.
1. Create the **Order model** with refs and timestamps.
2. Write the shared `buildOrder()` validation (address ownership, quantities, stock, prices from the DB, 2% tax).
3. Write **`placeOrderCOD`**, connect it to the Cart and redirect to My Orders.
4. Create a **Stripe** account (test mode) and write **`placeOrderStripe`**: line items in paise, a tax line, success/cancel URLs and metadata.
5. Write the **webhook** (`/stripe`, raw body, `constructEvent`, `completed` → paid, `expired` → delete unpaid).
6. Build the **Loading** page for the post-payment redirect.
7. Write `getUserOrders` / `getAllOrders` with `populate()`; finish the **MyOrders** and seller **Orders** pages.
8. Test with the Stripe CLI: `stripe listen --forward-to localhost:4000/stripe` and card `4242…`.

✅ *End of day: COD and card payments both create orders visible to the customer and the seller.*

### 📅 Day 7: Hardening, polish, deployment and docs
**Goal:** production-ready and live.
1. **Security pass:** input validation, authenticate before uploads, open-redirect guard, generic login errors.
2. **UX pass:** loading/disabled buttons, empty-cart state, "product not found" page, out-of-stock handling, deduplicated toasts, the Axios error interceptor.
3. **Reliability:** DB connection reuse, fail-fast 503 when the DB is down, lazy Stripe init.
4. Run `npm run lint` and `npm run build` and fix the warnings.
5. **Deploy the backend** to Vercel (`vercel.json`, `export default app`, env vars, `NODE_ENV=production`).
6. **Deploy the frontend** to Vercel (SPA rewrite, `VITE_BACKEND_URL` set to the backend URL).
7. Register the production Stripe webhook URL; allow `0.0.0.0/0` in Atlas.
8. Smoke-test the live site end to end; write the **README** and this **learning.md**.

✅ *End of day: FoodBasket is live. 🎉*

---

## 20. 20 Interview Questions with Answers

### Q1. Explain the architecture of your project.
**Answer:** It's a MERN application split into a React SPA (built with Vite) and an Express REST API, both on Vercel. The API is structured as routes → middleware → controllers → Mongoose models, and talks to MongoDB Atlas. Images go to Cloudinary and payments go through Stripe Checkout plus webhooks. The frontend keeps global state in the Context API and talks to the API with Axios, using cookie-based JWT auth.
**Reasoning:** Interviewers want to see that you understand how the pieces fit together and why each external service exists (no disk on serverless → Cloudinary; PCI → Stripe-hosted page).

### Q2. Why did you choose MongoDB over a SQL database?
**Answer:** The data is document-shaped: a product has arrays of images and description lines, and a cart is a key-value map. MongoDB stores these naturally without join tables. Mongoose still gives schemas and validation, and `populate()` handles the few relationships (orders → products/addresses). Atlas also has a free hosted tier.
**Reasoning:** Show you know the trade-off. SQL would be better for complex transactions and reporting, and you could mention that MongoDB also supports multi-document transactions if needed.

### Q3. How does authentication work, and why store the JWT in a cookie instead of localStorage?
**Answer:** On login the server verifies the password with bcrypt, signs a JWT containing the user id (7-day expiry) and sets it as an HTTP-only, Secure, SameSite cookie. The browser sends it automatically, and the `authUser` middleware verifies it and sets `req.userId`. An HTTP-only cookie can't be read by JavaScript, so an XSS attack can't steal it, whereas anything in localStorage can be read by any script.
**Reasoning:** This tests your security awareness. Mention the CSRF trade-off and how `SameSite` reduces it.

### Q4. Why `sameSite: "none"` in production and `"strict"` in development?
**Answer:** In production the frontend and backend are on different domains (two `vercel.app` subdomains, and `vercel.app` is on the Public Suffix List, so they count as different sites). For the browser to send the cookie on cross-site API calls, it must be `SameSite=None`, which browsers only allow together with `Secure`. Locally both run on `localhost`, which is the same site, so the stricter setting works.
**Reasoning:** A common real-world deployment bug ("login works locally but not in production"). Knowing this shows hands-on experience.

### Q5. How do you prevent users from tampering with prices?
**Answer:** The client sends only product ids and quantities. The server loads each product from MongoDB, uses its `offerPrice`, checks stock and that the quantity is a positive whole number, and calculates the tax and total itself. The same function serves both COD and Stripe.
**Reasoning:** "Never trust the client" is a core backend principle. Anything in the browser can be edited in DevTools.

### Q6. Why do you use a Stripe webhook instead of marking the order paid on the success page?
**Answer:** The success URL is just a link, so anyone can open it without paying, and users might close the tab before the redirect. The webhook is a server-to-server call from Stripe, signed with a secret, and verified with `stripe.webhooks.constructEvent`. Only then do we set `isPaid: true`. It's the single trustworthy source of truth for payment status.
**Reasoning:** This shows you understand asynchronous payment confirmation and why you shouldn't trust the client.

### Q7. Why is the webhook route registered before `express.json()`?
**Answer:** Stripe's signature is calculated over the exact raw request bytes. `express.json()` would parse and change the body, so verification would fail. The webhook route uses `express.raw({ type: "application/json" })` and is registered first, so it receives a Buffer.
**Reasoning:** A subtle but very common bug. It shows you understand how Express middleware order works.

### Q8. How does the cart persist, and how do you handle a guest cart when the user logs in?
**Answer:** The cart is an object `{ productId: quantity }` in React context. For logged-in users, a `useEffect` posts it to `/api/cart/update` whenever it changes, and it's stored on the User document. On login, `loginUser()` merges the guest cart with the server cart, taking the larger quantity for each item, so nothing is lost. A `useRef` flag skips the redundant sync right after loading the cart from the server.
**Reasoning:** This shows you think about edge cases and real user journeys, not just the happy path.

### Q9. Why did you use the Context API instead of Redux?
**Answer:** The global state is small (user, cart, products, search, a couple of flags) and changes in predictable ways. Context gives global access without prop-drilling and without Redux's extra setup. If the app grew (many slices, complex async flows, the need for devtools time-travel), I would move to Redux Toolkit or Zustand.
**Reasoning:** Interviewers like it when you justify the simpler tool and know when to switch.

### Q10. What is `populate()` in Mongoose and where do you use it?
**Answer:** It replaces stored ObjectId references with the actual documents in a second query, similar to a JOIN. Orders store only product and address ids. When listing orders, `.populate("items.product", "name image offerPrice category").populate("address")` returns everything the UI needs in one response, while the database keeps a single source of truth.
**Reasoning:** A core Mongoose concept. Mention the field selection (`select`) to show you care about payload size.

### Q11. How are product images uploaded and stored?
**Answer:** The seller form sends `multipart/form-data`. The `authSeller` middleware runs first, then Multer saves up to 4 files to a temp folder. The controller uploads them to Cloudinary in parallel with `Promise.all`, stores the returned `secure_url`s in the product's `image` array and deletes the temp files in a `finally` block.
**Reasoning:** Serverless platforms like Vercel have no permanent file system, so files must go to object storage or a CDN. Authenticating before parsing uploads stops strangers from using the server's disk.

### Q12. How did you deploy an Express server on Vercel, which is serverless?
**Answer:** `vercel.json` uses the `@vercel/node` builder on `server.js` and routes every path to it. `server.js` does `export default app` and only calls `app.listen()` when not on Vercel (`process.env.VERCEL`). Vercel calls the exported Express app as a request handler for each invocation. The MongoDB connection is cached and reused across warm invocations.
**Reasoning:** This shows you understand the difference between a long-running server and serverless functions (cold starts, statelessness).

### Q13. Why does the frontend need `vercel.json` with a rewrite to `/`?
**Answer:** It's a single-page app: there's one `index.html`, and React Router handles paths in the browser. If a user refreshes `/cart`, the server would look for a `/cart` file and return 404. The rewrite serves `index.html` for every path, so React Router can render the right page.
**Reasoning:** A classic SPA deployment issue.

### Q14. How do you protect the seller (admin) routes?
**Answer:** The seller logs in with credentials stored in environment variables and gets a separate `sellerToken` cookie containing their email. The `authSeller` middleware verifies the JWT and checks that the email matches `SELLER_EMAIL`. Routes such as add product, change stock, delete and view all orders use this middleware. On the frontend, `/seller` renders the login form unless `isSeller` is true, but the real protection is on the server.
**Reasoning:** The key point is that **frontend guards are only for UX; the server must enforce authorization.**

### Q15. How are passwords stored?
**Answer:** They're hashed with bcrypt (cost factor 10), which adds a random salt and is deliberately slow, so rainbow tables and brute force become impractical. Login uses `bcrypt.compare`. The hash is never sent back (`.select("-password")`), and the error message doesn't reveal whether the email exists.
**Reasoning:** Basic security knowledge. Mention why plain SHA-256 isn't enough: it's too fast and unsalted by default.

### Q16. What does `{ minimize: false }` do in the User schema?
**Answer:** By default Mongoose removes empty objects when saving. With `minimize: false`, a new user's `cartItems: {}` is actually stored, so `cartItems` always exists as an object and the frontend never has to deal with `undefined`.
**Reasoning:** A detail-oriented question that shows you read the docs and understand the defaults.

### Q17. Why multiply by 100 and use `Math.round` for Stripe amounts?
**Answer:** Stripe expects amounts in the smallest currency unit (paise for INR) as whole numbers, which avoids fractional money. Floating-point maths can give values like `19.99 × 100 = 1998.9999…`. `Math.floor` would undercharge by one paisa, while `Math.round` gives the correct `1999`.
**Reasoning:** Money and floating-point handling is a favourite interview topic. In general, store money as whole numbers of the smallest unit.

### Q18. How do you handle the case where the database is down?
**Answer:** Mongoose command buffering is disabled, so queries don't wait 10 seconds for a connection. A middleware on `/api` checks the connection, tries to reconnect once (sharing one connection promise between concurrent requests, with a 5-second server-selection timeout), and otherwise immediately returns `503 { message: "Database is unavailable right now" }`. An Axios interceptor shows that message in a toast. The app recovers automatically once the database is back.
**Reasoning:** Shows you think about failure modes, user experience and serverless realities, not just the happy path.

### Q19. What are `useEffect`, `useRef`, `useMemo` and `structuredClone` used for in your project?
**Answer:**
- **`useEffect`:** side effects. Fetch data on mount, sync the cart to the server when it changes, redirect after payment (with cleanup of the timer).
- **`useRef`:** the `skipNextSync` flag. A mutable value that persists across renders without causing a re-render.
- **`useMemo`:** compute related products on the details page only when `products` or the current product changes.
- **`structuredClone`:** deep-copy the cart before changing it, so React sees a new reference and re-renders. Mutating state directly would not trigger an update.

**Reasoning:** Tests practical React knowledge: immutability and the difference between state, refs and derived values.

### Q20. If you had more time, what would you improve or scale?
**Answer:**
1. Snapshot the product name and price into each order item, so order history stays exact even if prices change.
2. Add order status updates by the seller (Packed → Shipped → Delivered) and email notifications.
3. Support multiple sellers with a Seller collection and role-based access.
4. Add pagination and server-side search for large catalogues, plus database indexes.
5. Write automated tests (Jest + Supertest for the API, React Testing Library for the UI) and CI.
6. Add rate limiting (`express-rate-limit`) and Helmet security headers.
7. Decrement inventory using MongoDB transactions.
8. Add product reviews and ratings instead of the fixed 4 stars.
9. Use TypeScript for type safety.

**Reasoning:** Interviewers check whether you can critique your own work and think about production concerns: data integrity, scalability, testing and security.

---

## 21. Glossary

| Term | Meaning |
|---|---|
| **MERN** | MongoDB, Express, React, Node.js. |
| **SPA** | Single Page Application: one HTML page, and JavaScript swaps the views. |
| **JWT** | JSON Web Token: a signed token proving identity. |
| **HTTP-only cookie** | A cookie that JavaScript cannot read. |
| **CORS** | Cross-Origin Resource Sharing: browser rules for calls between domains. |
| **ODM** | Object Data Modeling (Mongoose): schemas on top of MongoDB. |
| **Middleware** | A function that runs between the request and the route handler (e.g. auth). |
| **Webhook** | A server-to-server HTTP callback sent when an event happens (e.g. payment completed). |
| **CDN** | Content Delivery Network: serves files from servers near the user. |
| **Serverless** | Code that runs as on-demand functions; no server to manage. |
| **Cold start** | The extra delay when a serverless function starts from idle. |
| **HMR** | Hot Module Replacement: instant updates in the dev browser. |
| **populate()** | Mongoose method that replaces ids with the referenced documents. |
| **COD** | Cash on Delivery. |
| **PCI DSS** | Card-data security standard; avoided by using Stripe-hosted Checkout. |

---

*End of FoodBasket Learning Guide.*
