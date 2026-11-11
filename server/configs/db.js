import mongoose from "mongoose";

// Don't queue queries for 10s when the DB is down — fail immediately instead.
mongoose.set("bufferCommands", false);

let connecting = null;

mongoose.connection.on("connected", () => console.log("Database Connected"));
mongoose.connection.on("disconnected", () => console.log("Database Disconnected"));

// Connects once and reuses the connection. If a previous attempt failed,
// the next call retries (important on Vercel, where a cold start may happen
// while the DB is briefly unreachable).
const connectDB = async () => {
    if (mongoose.connection.readyState === 1) return true;

    if (!process.env.MONGODB_URI) {
        console.error("MONGODB_URI is not set");
        return false;
    }

    if (!connecting) {
        connecting = mongoose
            .connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
            .then(() => true)
            .catch((error) => {
                console.error("Database connection error:", error.message);
                return false;
            })
            .finally(() => {
                connecting = null;
            });
    }

    return connecting;
}

export const isDBConnected = () => mongoose.connection.readyState === 1;

export default connectDB;
