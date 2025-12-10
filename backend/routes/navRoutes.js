import express from "express";

const router = express.Router();

const NAV_PAGES = [
  {
    id: "pillars",
    path: "/pillars",
    title: "Pillars",
    description:
      "Explore the eight wellbeing pillars and view your latest scores.",
    status: "placeholder",
  },
  {
    id: "habits",
    path: "/habits",
    title: "Habits",
    description: "Create and review habits aligned to your goals.",
    status: "placeholder",
  },
  {
    id: "check-ins",
    path: "/check-ins",
    title: "Check-ins",
    description: "Log daily and weekly check-ins to track your momentum.",
    status: "placeholder",
  },
  {
    id: "coach-chat",
    path: "/coach-chat",
    title: "Coach Chat",
    description: "Chat with the NorthStar coach for guidance and nudges.",
    status: "placeholder",
  },
  {
    id: "checkout",
    path: "/checkout",
    title: "Checkout",
    description: "Upgrade to Premium—payment flow coming soon.",
    status: "placeholder",
  },
];

router.get("/pages", (req, res) => {
  res.json({
    ok: true,
    pages: NAV_PAGES,
  });
});

router.get("/pillars", (req, res) => {
  res.json({
    ok: true,
    page: NAV_PAGES.find((page) => page.id === "pillars"),
    data: {
      message: "Pillar page backend stub — full content coming soon.",
      actions: ["view-pillars", "open-pillar-details"],
    },
  });
});

router.get("/habits", (req, res) => {
  res.json({
    ok: true,
    page: NAV_PAGES.find((page) => page.id === "habits"),
    data: {
      message: "Habit library placeholder. Add habits once the flow is live.",
      actions: ["list-habits", "create-habit"],
    },
  });
});

router.get("/check-ins", (req, res) => {
  res.json({
    ok: true,
    page: NAV_PAGES.find((page) => page.id === "check-ins"),
    data: {
      message: "Check-in stub — record daily or weekly reflections soon.",
      actions: ["start-daily-check-in", "view-history"],
    },
  });
});

router.get("/coach-chat", (req, res) => {
  res.json({
    ok: true,
    page: NAV_PAGES.find((page) => page.id === "coach-chat"),
    data: {
      message: "Coach chat stub — AI conversations will be wired shortly.",
      actions: ["open-chat", "review-prompts"],
    },
  });
});

router.get("/checkout", (req, res) => {
  res.json({
    ok: true,
    page: NAV_PAGES.find((page) => page.id === "checkout"),
    data: {
      message: "Checkout placeholder — payments are disabled in this preview.",
      actions: ["start-checkout", "view-plans"],
    },
  });
});

export default router;
