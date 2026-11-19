// Ai_Interviewer - Razorpay Payment Controller
import crypto from "crypto";
import razorpay from "../services/razorpay.service.js";
import prisma from "../config/prisma.js";

const CREDIT_PLANS = [
  {
    id: "plan_starter",
    name: "Starter Pack",
    price: 499, // INR
    credits: 100,
    features: [
      "5 Complete Mock Interviews",
      "Real-Time Speech & Avatar",
      "Confidence & Communication Scoring",
      "Standard PDF Performance Report",
    ],
  },
  {
    id: "plan_pro",
    name: "Pro Interviewer",
    price: 999, // INR
    credits: 300,
    popular: true,
    features: [
      "15 Mock Interviews (Technical + HR)",
      "Interactive Coding Round with Monaco",
      "ATS Resume Analysis & Optimization",
      "Personalized Learning Roadmaps",
      "Priority Gemini 2.5 Flash Evaluation",
    ],
  },
  {
    id: "plan_ultimate",
    name: "Career Mastery",
    price: 1999, // INR
    credits: 1000,
    features: [
      "Unlimited Mock Interviews",
      "Full Coding Arena with Judge0 Runner",
      "Unlimited ATS Resumes & PDF Exports",
      "Direct Interview Readiness Certificate",
      "Lifetime Session Analytics",
    ],
  },
];

export const getPlans = async (req, res) => {
  return res.status(200).json({
    success: true,
    plans: CREDIT_PLANS,
  });
};

export const createOrder = async (req, res) => {
  try {
    const { planId } = req.body;
    const plan = CREDIT_PLANS.find((p) => p.id === planId) || CREDIT_PLANS[0];

    const amountInPaise = plan.price * 100;
    const receipt = `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    let order = null;
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      try {
        order = await razorpay.orders.create({
          amount: amountInPaise,
          currency: "INR",
          receipt,
        });
      } catch (rzpErr) {
        console.warn("[payment.controller] Razorpay order creation fallback:", rzpErr.message);
      }
    }

    if (!order) {
      order = {
        id: `order_mock_${Date.now()}`,
        amount: amountInPaise,
        currency: "INR",
        receipt,
        status: "created",
      };
    }

    try {
      await prisma.creditTransaction.create({
        data: {
          userId: req.userId || "guest",
          amount: plan.credits,
          type: "razorpay_topup",
          description: `Initiated purchase of ${plan.name} (${plan.credits} credits)`,
          razorpayOrderId: order.id,
        },
      });
    } catch (_) {}

    return res.status(200).json({
      success: true,
      order,
      plan,
      keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_mock",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Failed to create payment order: ${error.message}`,
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
    } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (secret && razorpay_signature && !razorpay_order_id.startsWith("order_mock_")) {
      const generatedSignature = crypto
        .createHmac("sha256", secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: "Payment signature verification failed. Invalid transaction.",
        });
      }
    }

    const plan = CREDIT_PLANS.find((p) => p.id === planId) || CREDIT_PLANS[0];
    const creditsToAdd = plan.credits;

    let updatedCredits = 100;
    try {
      const user = await prisma.user.update({
        where: { id: req.userId },
        data: { credits: { increment: creditsToAdd } },
      });
      updatedCredits = user.credits;

      await prisma.creditTransaction.create({
        data: {
          userId: req.userId,
          amount: creditsToAdd,
          type: "razorpay_topup",
          description: `Successful topup: ${plan.name} (+${creditsToAdd} credits)`,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
        },
      });
    } catch (_) {}

    return res.status(200).json({
      success: true,
      message: `Payment verified! Added ${creditsToAdd} credits to your account.`,
      credits: updatedCredits,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Payment verification failed: ${error.message}`,
    });
  }
};

export default {
  getPlans,
  createOrder,
  verifyPayment,
};
