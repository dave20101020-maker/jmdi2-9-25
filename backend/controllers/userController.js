import User from "../models/User.js";
import OnboardingProfile from "../models/OnboardingProfile.js";
import PillarScore from "../models/PillarScore.js";
import ActionPlan from "../models/ActionPlan.js";
import Message from "../models/Message.js";
import Challenge from "../models/Challenge.js";
import Friend from "../models/Friend.js";
import PillarCheckIn from "../models/PillarCheckIn.js";
import Notification from "../models/Notification.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { logAuditEvent } from "../middleware/auditLogger.js";
import {
  getAllowedPillarsForTier,
  mapTierToLegacy,
  normalizeTier,
} from "../utils/subscriptionAccess.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const COOKIE_NAME = process.env.JWT_COOKIE_NAME || "ns_token";
const COOKIE_SECURE = process.env.NODE_ENV === "production";

function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function setTokenCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SECURE ? "strict" : "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

// POST /api/users/register
export const register = async (req, res) => {
  try {
    const { name, username, email, password, subscriptionTier } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: "username, email and password are required" });
    }

    // Password strength check
    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    // Check uniqueness
    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });
    if (existing) {
      return res
        .status(409)
        .json({ error: "User with that email or username already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const normalizedTier = normalizeTier(subscriptionTier || "free");
    const allowedPillars = getAllowedPillarsForTier(normalizedTier);
    const legacyTier = mapTierToLegacy(normalizedTier);
    const subscriptionState = {
      tier: normalizedTier,
      status: "active",
      startedAt: new Date(),
      trialUsed: false,
      source: "self",
    };

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = new User({
      name,
      username,
      email: email.toLowerCase(),
      passwordHash,
      subscriptionTier: legacyTier,
      subscription: subscriptionState,
      allowedPillars,
      verificationToken,
      verificationTokenExpires,
      emailVerified: false,
    });

    await user.save();

    // Create JWT token
    const token = createToken({ id: user._id, email: user.email });
    setTokenCookie(res, token);

    // TODO: Send verification email with verificationToken
    // For now, just return success

    return res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        allowedPillars: user.allowedPillars,
        emailVerified: user.emailVerified,
      },
      message:
        "User registered successfully. Please check your email to verify your account.",
    });
  } catch (err) {
    console.error("register error", err);
    return res.status(500).json({ error: "Server error during registration" });
  }
};

// POST /api/users/login
export const login = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res
        .status(400)
        .json({ error: "emailOrUsername and password required" });
    }

    // Find user by email or username
    const user = await User.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { username: emailOrUsername },
      ],
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if account is active
    if (!user.isActive) {
      return res
        .status(403)
        .json({ error: "Account is deactivated. Please contact support." });
    }

    // Verify password
    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Create JWT token
    const token = createToken({ id: user._id, email: user.email });
    setTokenCookie(res, token);

    return res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        allowedPillars: user.allowedPillars,
        emailVerified: user.emailVerified,
        settings: user.settings,
      },
    });
  } catch (err) {
    console.error("login error", err);
    return res.status(500).json({ error: "Server error during login" });
  }
};

// POST /api/users/verify-email
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Verification token is required" });
    }

    // Find user with valid token
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ error: "Invalid or expired verification token" });
    }

    // Mark email as verified
    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (err) {
    console.error("verifyEmail error", err);
    return res.status(500).json({ error: "Server error during verification" });
  }
};

// POST /api/users/resend-verification
export const resendVerification = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: "Email is already verified" });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.verificationToken = verificationToken;
    user.verificationTokenExpires = verificationTokenExpires;
    await user.save();

    // TODO: Send verification email

    return res.status(200).json({
      success: true,
      message: "Verification email sent",
    });
  } catch (err) {
    console.error("resendVerification error", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// POST /api/users/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If that email exists, a password reset link has been sent",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpires = resetPasswordExpires;
    await user.save();

    // TODO: Send reset email with resetToken (not hashed version)

    return res.status(200).json({
      success: true,
      message: "If that email exists, a password reset link has been sent",
    });
  } catch (err) {
    console.error("forgotPassword error", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// POST /api/users/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      await logAuditEvent({
        action: "password-change",
        req,
        status: "failure",
        description: "Password reset missing token or new password",
        metadata: { flow: "reset" },
      });
      return res
        .status(400)
        .json({ error: "Token and new password are required" });
    }

    if (newPassword.length < 8) {
      await logAuditEvent({
        action: "password-change",
        req,
        status: "failure",
        description: "Password reset rejected due to length",
        metadata: { flow: "reset" },
      });
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    // Hash the token to compare
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      await logAuditEvent({
        action: "password-change",
        req,
        status: "failure",
        description: "Password reset token invalid or expired",
        metadata: { flow: "reset" },
      });
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    await logAuditEvent({
      action: "password-change",
      req,
      userId: user._id,
      status: "success",
      description: "Password reset completed via token",
      metadata: { flow: "reset" },
    });

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (err) {
    console.error("resetPassword error", err);
    await logAuditEvent({
      action: "password-change",
      req,
      status: "failure",
      description: err?.message || "Unhandled reset password error",
      metadata: { flow: "reset" },
    });
    return res.status(500).json({ error: "Server error" });
  }
};

// GET /api/users/me
export const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        allowedPillars: user.allowedPillars,
        pillars: user.pillars,
        settings: user.settings,
        emailVerified: user.emailVerified,
        current_streak: user.current_streak,
        longest_streak: user.longest_streak,
        badges: user.badges,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (err) {
    console.error("getCurrentUser error", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// PUT /api/users/me
export const updateCurrentUser = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { name, settings } = req.body;

    // Update allowed fields
    if (name !== undefined) user.name = name;
    if (settings !== undefined) {
      user.settings = { ...user.settings, ...settings };
    }

    await user.save();

    return res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        settings: user.settings,
      },
    });
  } catch (err) {
    console.error("updateCurrentUser error", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// POST /api/users/change-password
export const changePassword = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      await logAuditEvent({
        action: "password-change",
        req,
        status: "denied",
        description: "Unauthenticated password change attempt",
      });
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      await logAuditEvent({
        action: "password-change",
        req,
        userId: user._id,
        status: "failure",
        description: "Missing current or new password values",
      });
      return res
        .status(400)
        .json({ error: "Current and new password are required" });
    }

    if (newPassword.length < 8) {
      await logAuditEvent({
        action: "password-change",
        req,
        userId: user._id,
        status: "failure",
        description: "New password did not meet length requirement",
      });
      return res
        .status(400)
        .json({ error: "New password must be at least 8 characters" });
    }

    // Verify current password
    const userWithPassword = await User.findById(user._id);
    const matches = await bcrypt.compare(
      currentPassword,
      userWithPassword.passwordHash
    );

    if (!matches) {
      await logAuditEvent({
        action: "password-change",
        req,
        userId: user._id,
        status: "denied",
        description: "Current password verification failed",
      });
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    userWithPassword.passwordHash = await bcrypt.hash(newPassword, salt);
    await userWithPassword.save();

    await logAuditEvent({
      action: "password-change",
      req,
      userId: user._id,
      status: "success",
      description: "Password changed via authenticated request",
    });

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    console.error("changePassword error", err);
    await logAuditEvent({
      action: "password-change",
      req,
      userId: req.user?._id,
      status: "failure",
      description: err?.message || "Unhandled changePassword error",
    });
    return res.status(500).json({ error: "Server error" });
  }
};

// GET /api/user/export
export const exportUserData = async (req, res) => {
  try {
    const user = req.user;
    if (!user)
      return res
        .status(401)
        .json({ success: false, error: "Not authenticated" });

    const uid = String(user._1d || user._id);

    const profile = await User.findById(uid).lean();
    const onboarding = await OnboardingProfile.findOne({ userId: uid }).lean();
    const pillarScores = await PillarScore.find({ userId: uid }).lean();
    const actionPlans = await ActionPlan.find({ userId: uid }).lean();
    const messages = await Message.find({
      $or: [{ senderId: uid }, { receiverId: uid }],
    }).lean();
    const challenges = await Challenge.find({
      $or: [{ creatorId: uid }, { participants: uid }],
    }).lean();
    const friends = await Friend.find({
      $or: [{ userId: uid }, { friendId: uid }],
    }).lean();
    const checkins = await PillarCheckIn.find({ userId: uid }).lean();
    const notifications = await Notification.find({ userId: uid }).lean();

    const bundle = {
      exportedAt: new Date().toISOString(),
      profile,
      onboarding,
      pillarScores,
      actionPlans,
      messages,
      challenges,
      friends,
      checkins,
      notifications,
    };

    const filename = `northstar_export_${uid}_${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/json");
    return res.send(JSON.stringify(bundle, null, 2));
  } catch (err) {
    console.error("exportUserData error", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

// POST /api/user/delete-account
export const deleteAccount = async (req, res) => {
  try {
    const user = req.user;
    if (!user)
      return res
        .status(401)
        .json({ success: false, error: "Not authenticated" });

    const uid = String(user._id);

    // Remove user-owned documents
    await OnboardingProfile.deleteMany({ userId: uid });
    await PillarScore.deleteMany({ userId: uid });
    await ActionPlan.deleteMany({ userId: uid });
    await Message.deleteMany({ $or: [{ senderId: uid }, { receiverId: uid }] });
    // For challenges: remove user from participants; delete challenges they created
    await Challenge.updateMany(
      { participants: uid },
      { $pull: { participants: uid } }
    );
    await Challenge.deleteMany({ creatorId: uid });
    // Remove friend records involving user
    await Friend.deleteMany({ $or: [{ userId: uid }, { friendId: uid }] });
    // Remove checkins and notifications
    await PillarCheckIn.deleteMany({ userId: uid });
    await Notification.deleteMany({ userId: uid });

    // Finally remove user account
    await User.findByIdAndDelete(uid);

    return res.json({ success: true });
  } catch (err) {
    console.error("deleteAccount error", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

// POST /api/user/consent
export const updateConsent = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { aiConsent, consentTimestamp, consentVersion } = req.body;

    if (aiConsent === undefined) {
      return res.status(400).json({ error: "aiConsent field is required" });
    }

    // Update consent fields
    user.aiConsent = Boolean(aiConsent);
    user.consentTimestamp = consentTimestamp
      ? new Date(consentTimestamp)
      : new Date();
    user.consentVersion = consentVersion || "1.0";

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Consent updated successfully",
      data: {
        aiConsent: user.aiConsent,
        consentTimestamp: user.consentTimestamp,
        consentVersion: user.consentVersion,
      },
    });
  } catch (err) {
    console.error("updateConsent error", err);
    return res
      .status(500)
      .json({ error: "Server error while updating consent" });
  }
};

// GET /api/user/consent
export const getConsent = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    return res.status(200).json({
      success: true,
      data: {
        aiConsent: user.aiConsent,
        consentTimestamp: user.consentTimestamp,
        consentVersion: user.consentVersion,
      },
    });
  } catch (err) {
    console.error("getConsent error", err);
    return res.status(500).json({ error: "Server error" });
  }
};

export default {
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  updateCurrentUser,
  changePassword,
  exportUserData,
  deleteAccount,
  updateConsent,
  getConsent,
};
