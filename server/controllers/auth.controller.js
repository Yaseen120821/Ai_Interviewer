// Ai_Interviewer - Firebase Authentication Controller
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

const JWT_SECRET = process.env.JWT_SECRET || "interviewpilot_super_secret_jwt_key_2026_dev_secure";

export const firebaseSync = async (req, res) => {
  try {
    const { email, name, firebaseUid, uid, instantUserId } = req.body;

    if (!email || !email.includes("@")) {
      return res.status(400).json({
        success: false,
        message: "Valid email address is required for authentication.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name && name.trim()) || cleanEmail.split("@")[0];
    const cleanUid = firebaseUid || uid || instantUserId || `fb_${Date.now()}`;

    // Try finding or upserting user in PostgreSQL via Prisma
    let user = null;
    try {
      user = await prisma.user.findFirst({
        where: {
          OR: [{ email: cleanEmail }, { instantUserId: cleanUid }],
        },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: cleanEmail,
            name: cleanName,
            instantUserId: cleanUid,
            credits: 100, // Sign-up bonus credits
          },
        });
      } else if (!user.instantUserId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { instantUserId: cleanUid },
        });
      }
    } catch (dbErr) {
      console.warn("[auth.controller] Prisma fallback/mock mode:", dbErr.message);
      // Fallback in-memory user record if DB is offline during quick testing
      user = {
        id: `usr_${Date.now()}`,
        email: cleanEmail,
        name: cleanName,
        instantUserId: cleanUid,
        credits: 100,
        createdAt: new Date(),
      };
    }

    // Sign JWT session token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        credits: user.credits,
        profileImage: user.profileImage || null,
        firebaseUid: cleanUid,
      },
    });
  } catch (error) {
    console.error("[auth.controller] firebaseSync error:", error);
    return res.status(500).json({
      success: false,
      message: `Firebase authentication sync failed: ${error.message}`,
    });
  }
};

// Backwards-compatible alias
export const instantSync = firebaseSync;

export const getMe = async (req, res) => {
  try {
    let user = null;
    try {
      user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: {
          id: true,
          name: true,
          email: true,
          credits: true,
          profileImage: true,
          instantUserId: true,
          createdAt: true,
        },
      });
    } catch (_) {}

    if (!user) {
      user = {
        id: req.userId,
        name: req.user?.name || "Candidate",
        email: req.user?.email || "candidate@interviewpilot.ai",
        credits: 100,
      };
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Failed to fetch profile: ${error.message}`,
    });
  }
};

export const logOut = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    res.clearCookie("token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });
    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Logout failed: ${error.message}`,
    });
  }
};

export default {
  firebaseSync,
  instantSync,
  getMe,
  logOut,
};
