import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PremiumFeatureGate({
  feature,
  description,
  isBlocked = true,
  onUpgradeClick,
  children,
}) {
  if (!isBlocked) {
    return <>{children}</>;
  }

  return (
    <div
      className="bg-gradient-to-br from-[#D4AF37]/10 to-[#F4D03F]/10 border-2 border-[#D4AF37]/40 rounded-2xl p-8 text-center"
      style={{ boxShadow: "0 0 30px rgba(212, 175, 55, 0.2)" }}
    >
      <div
        className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] flex items-center justify-center"
        style={{ boxShadow: "0 0 30px rgba(212, 175, 55, 0.5)" }}
      >
        <Crown className="w-8 h-8 text-[#0A1628]" />
      </div>

      <h3 className="text-2xl font-bold text-white mb-2">{feature}</h3>
      <p className="text-white/70 mb-6 text-base max-w-md mx-auto">
        {description}
      </p>

      <Link to={createPageUrl("Upgrade")}>
        <Button className="btn-primary px-8 py-6 text-base">
          <Sparkles className="w-5 h-5 mr-2" />
          Upgrade to Premium
        </Button>
      </Link>

      <p className="text-white/50 text-sm mt-4">Or start a 7-day free trial</p>
    </div>
  );
}
