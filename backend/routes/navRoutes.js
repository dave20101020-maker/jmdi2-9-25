import express from "express";
import Habit from "../models/Habit.js";
import PillarScore from "../models/PillarScore.js";
import PillarCheckIn from "../models/PillarCheckIn.js";
import { VALID_PILLARS } from "../utils/pillars.js";
import { prisma } from "../src/db/prismaClient.js";
import { pgFirstRead } from "../src/utils/readSwitch.js";

const router = express.Router();

const basePages = [
  {
    id: "pillars",
    path: "/pillars",
    title: "Pillars",
    description:
      "Explore the eight wellbeing pillars and view your latest scores.",
    status: "live",
    primaryAction: { method: "GET", href: "/api/pillars" },
  },
  {
    id: "habits",
    path: "/habits",
    title: "Habits",
    description: "Create and review habits aligned to your goals.",
    status: "live",
    primaryAction: { method: "GET", href: "/api/habits" },
  },
  {
    id: "check-ins",
    path: "/check-ins",
    title: "Check-ins",
    description: "Log daily and weekly check-ins to track your momentum.",
    status: "live",
    primaryAction: { method: "POST", href: "/api/pillars/check-in" },
  },
  {
    id: "coach-chat",
    path: "/coach-chat",
    title: "Coach Chat",
    description: "Chat with the NorthStar coach for guidance and nudges.",
    status: "live",
    primaryAction: { method: "POST", href: "/api/ai/unified/chat" },
  },
  {
    id: "checkout",
    path: "/checkout",
    title: "Checkout",
    description:
      "Upgrade to Premium—payment flow is ready to start a session or open billing.",
    status: "live",
    primaryAction: { method: "POST", href: "/api/payments/checkout-session" },
  },
];

const defaultProgress = {
  pillars: { completed: 0, total: VALID_PILLARS.length, lastUpdatedAt: null },
  habits: { active: 0, total: 0, lastUpdatedAt: null },
  checkIns: { count: 0, lastUpdatedAt: null },
  coach: { lastEngagedAt: null },
  billing: { status: "free" },
};

const buildPageSummaries = (progressSnapshot) => {
  const summaries = {
    pillars: {
      status:
        progressSnapshot.pillars.completed > 0 ? "in-progress" : "pending",
      stats: progressSnapshot.pillars,
      actions: [
        { label: "View pillars", method: "GET", href: "/api/pillars" },
        { label: "See trends", method: "GET", href: "/api/pillars/:id/trends" },
      ],
    },
    habits: {
      status: progressSnapshot.habits.active > 0 ? "in-progress" : "pending",
      stats: progressSnapshot.habits,
      actions: [
        { label: "List habits", method: "GET", href: "/api/habits" },
        { label: "Create habit", method: "POST", href: "/api/habits" },
      ],
    },
    "check-ins": {
      status: progressSnapshot.checkIns.count > 0 ? "in-progress" : "pending",
      stats: progressSnapshot.checkIns,
      actions: [
        {
          label: "Start check-in",
          method: "POST",
          href: "/api/pillars/check-in",
        },
        {
          label: "View history",
          method: "GET",
          href: "/api/pillars/:pillarId/history",
        },
      ],
    },
    "coach-chat": {
      status: progressSnapshot.coach.lastEngagedAt ? "in-progress" : "pending",
      stats: progressSnapshot.coach,
      actions: [
        {
          label: "Chat with coach",
          method: "POST",
          href: "/api/ai/unified/chat",
        },
        { label: "Review focus", method: "GET", href: "/api/ai/today-focus" },
      ],
    },
    checkout: {
      status:
        progressSnapshot.billing.status === "active" ? "completed" : "pending",
      stats: progressSnapshot.billing,
      actions: [
        {
          label: "Start checkout",
          method: "POST",
          href: "/api/payments/checkout-session",
        },
        {
          label: "Manage billing",
          method: "POST",
          href: "/api/payments/portal",
        },
      ],
    },
  };

  return basePages.map((page) => ({
    ...page,
    summary: summaries[page.id] || null,
  }));
};

const fetchProgressSnapshot = async (userId) => {
  if (!userId) return defaultProgress;

  const [pillarScores, habits, checkIns] = await Promise.all([
    pgFirstRead({
      label: "nav:progress:pillarScores",
      meta: { userId },
      pgRead: async () => {
        const rows = await prisma.pillarScore.findMany({
          where: { userId },
          orderBy: { updatedAt: "desc" },
          take: VALID_PILLARS.length,
          select: { updatedAt: true },
        });
        return rows;
      },
      mongoRead: async () =>
        PillarScore.find({ userId })
          .sort({ updatedAt: -1 })
          .limit(VALID_PILLARS.length)
          .lean(),
    }),
    Habit.find({ userId }).sort({ updatedAt: -1 }).limit(50),
    pgFirstRead({
      label: "nav:progress:checkins",
      meta: { userId },
      pgRead: async () =>
        prisma.pillarCheckIn.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { createdAt: true },
        }),
      mongoRead: async () =>
        PillarCheckIn.find({ userId }).sort({ createdAt: -1 }).limit(10).lean(),
    }),
  ]);

  return {
    pillars: {
      completed: pillarScores.length,
      total: VALID_PILLARS.length,
      lastUpdatedAt: pillarScores[0]?.updatedAt || null,
    },
    habits: {
      active: habits.filter((h) => h.isActive).length,
      total: habits.length,
      lastUpdatedAt: habits[0]?.updatedAt || null,
    },
    checkIns: {
      count: checkIns.length,
      lastUpdatedAt: checkIns[0]?.createdAt || null,
    },
    coach: {
      lastEngagedAt: null,
    },
    billing: {
      status: "free",
    },
  };
};

router.get("/pages", async (req, res) => {
  try {
    const userId = req.user?._id?.toString() || req.query.userId;
    const progressSnapshot = await fetchProgressSnapshot(userId);
    const pages = buildPageSummaries(progressSnapshot);

    res.json({ ok: true, pages });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get("/pages/:id", async (req, res) => {
  try {
    const userId = req.user?._id?.toString() || req.query.userId;
    const progressSnapshot = await fetchProgressSnapshot(userId);
    const pages = buildPageSummaries(progressSnapshot);
    const page = pages.find((p) => p.id === req.params.id);

    if (!page) {
      return res.status(404).json({ ok: false, error: "Page not found" });
    }

    res.json({ ok: true, page });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
