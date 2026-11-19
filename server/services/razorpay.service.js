import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Razorpay from "razorpay";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const key_id = process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder";
const key_secret = process.env.RAZORPAY_KEY_SECRET || "rzp_secret_placeholder";

let razorpay = null;
try {
  razorpay = new Razorpay({
    key_id,
    key_secret,
  });
} catch (err) {
  console.warn("⚠️ Razorpay initialization deferred:", err.message);
}

export default razorpay;
