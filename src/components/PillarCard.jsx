import React from "react";
import { Link } from "react-router-dom";

export default function PillarCard({ pillar, score = 0, locked = false }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all">
      {locked && (
        <div className="flex items-center justify-center mb-2">
          <span className="text-2xl">🔒</span>
        </div>
      )}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{pillar?.icon || "⭐"}</span>
        <div>
          <h3 className="font-bold text-white">{pillar?.name || "Pillar"}</h3>
          <p className="text-sm text-white/60">
            {pillar?.description || "Description"}
          </p>
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-ns-gold">
          {locked ? "–" : score}
        </span>
        {!locked && <span className="text-white/60 text-sm">/100</span>}
      </div>
      {locked ? (
        <Link
          to="/pricing"
          className="mt-3 block text-center py-2 bg-ns-gold text-black rounded-lg font-bold text-sm"
        >
          Unlock
        </Link>
      ) : (
        <Link
          to={`/pillar/${pillar?.id}`}
          className="mt-3 block text-center py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm"
        >
          View Details
        </Link>
      )}
    </div>
  );
}
