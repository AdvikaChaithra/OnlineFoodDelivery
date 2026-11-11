// server/configs/cookie.js
// Shared cookie options so login, register and logout always use identical
// settings (a cookie can only be cleared with the same options it was set with).

const isProduction = () =>
  process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);

export const cookieOptions = () => ({
  httpOnly: true, // JavaScript cannot read the cookie
  secure: isProduction(), // HTTPS only in production
  // Frontend and backend live on different domains in production,
  // so the cookie must be sent cross-site there.
  sameSite: isProduction() ? "none" : "strict",
});

export const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
