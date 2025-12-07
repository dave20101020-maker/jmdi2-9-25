import { api } from "@/utils/apiClient";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";

/**
 * Component that checks if user has access to a specific pillar
 * Shows upgrade prompt if they don't have access
 */
export default function PillarAccessGuard({ pillarId, children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const {
    subscription,
    hasPremiumAccess,
    isTrial,
    daysRemaining,
    isLoading: subscriptionLoading,
  } = useSubscriptionStatus();

  useEffect(() => {
    async function checkAccess() {
      const currentUser = await api.authMe();
      setUser(currentUser);

      if (hasPremiumAccess) {
        setHasAccess(true);
      } else {
        const selectedPillars = currentUser.allowedPillars?.length
          ? currentUser.allowedPillars
          : currentUser.selected_pillars || [];
        setHasAccess(selectedPillars.includes(pillarId));
      }

      setLoading(false);
    }
    if (!subscriptionLoading) {
      checkAccess();
    }
  }, [pillarId, hasPremiumAccess, subscriptionLoading]);

  if (loading || subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#D4AF37]/20 animate-pulse" />
          <p className="text-white/60">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    const tierLabel = subscription?.tier || "free";
    return (
      <div className="min-h-screen pb-24 px-6 pt-8 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8"
            style={{ boxShadow: "0 0 30px rgba(212, 175, 55, 0.2)" }}
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
              <Lock className="w-10 h-10 text-white/60" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
              Premium Pillar
            </h2>
            <p className="text-white/60 mb-6">
              {hasPremiumAccess
                ? "Loading your access..."
                : isTrial
                ? `Your trial has ${
                    daysRemaining ?? 0
                  } days left. Unlock this pillar by continuing Premium after the trial ends.`
                : `This pillar is not included in your ${tierLabel} plan. Start your 7-day free trial or upgrade to unlock all 8 life pillars.`}
            </p>

            <div className="space-y-3">
              <Button
                onClick={() => navigate(createPageUrl("Upgrade"))}
                className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0A1628] font-bold"
                style={{ boxShadow: "0 0 20px rgba(212, 175, 55, 0.4)" }}
              >
                <Crown className="w-5 h-5 mr-2" />
                Start Free Trial
              </Button>

              <Button
                onClick={() => navigate(createPageUrl("Dashboard"))}
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
