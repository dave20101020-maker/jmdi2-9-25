import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Crown, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UpgradePrompt({
  title,
  description,
  icon = "👑",
  onClose,
  showClose = true,
}) {
  return (
    <div
      className="bg-gradient-to-r from-[#D4AF37]/20 to-[#F4D03F]/20 border border-[#D4AF37]/40 rounded-2xl p-5 relative"
      style={{ boxShadow: "0 0 20px rgba(212, 175, 55, 0.2)" }}
    >
      {showClose && onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/60 hover:text-white transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] flex items-center justify-center text-2xl flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-white font-bold mb-1 text-base">{title}</h3>
          <p className="text-white/80 text-sm mb-4">{description}</p>
          <Link to={createPageUrl("Upgrade")}>
            <Button className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0A1628] font-bold hover:shadow-lg text-sm py-5">
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Premium
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
