import React, { useState } from "react";
import { Trophy, Medal, UserPlus, Shield, Sparkles, Users } from "lucide-react";
import { themeTokens } from "@/components/ThemeProvider";

const leaderboard = [
  { name: "You", score: 74, rank: 3 },
  { name: "Alex", score: 80, rank: 1 },
  { name: "Priya", score: 77, rank: 2 },
  { name: "Sam", score: 70, rank: 4 },
];

const badges = ["Consistency", "Helper", "Hydration", "Mindful"];

export default function Leaderboards() {
  const [privacy, setPrivacy] = useState(true);
  const [joined, setJoined] = useState([]);
  const [inviteStatus, setInviteStatus] = useState("None");

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/60">
            Friends & Leaderboards
          </p>
          <h1 className="text-3xl font-semibold text-white">
            Friendly accountability
          </h1>
          <p className="text-sm text-white/70">
            Ranks, challenges, and badges with privacy controls.
          </p>
        </div>
        <div className={`${themeTokens.panel} p-4 text-center`}>
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">
            Personal rank
          </p>
          <p className="text-3xl font-bold text-white">#3</p>
          <p className="text-sm text-white/70">Score 74</p>
        </div>
      </header>

      <section className={`${themeTokens.card} p-4 space-y-3`}>
        <div className="flex items-center gap-2 text-white">
          <Trophy className="h-5 w-5 text-ns-gold" />
          <h3 className="text-lg font-semibold">Friends leaderboard</h3>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {leaderboard.map((entry) => (
            <div
              key={entry.name}
              className={`${themeTokens.panel} p-3 flex items-center justify-between`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{entry.rank}</span>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {entry.name}
                  </p>
                  <p className="text-xs text-white/60">Score {entry.score}</p>
                </div>
              </div>
              {entry.rank === 1 && <Medal className="h-5 w-5 text-amber-300" />}
            </div>
          ))}
        </div>
        <p className="text-sm text-white/70">
          Weekly top improver: Priya (+6). Badge awarded.
        </p>
      </section>

      <section className={`${themeTokens.card} p-4 space-y-3`}>
        <div className="flex items-center gap-2 text-white">
          <Users className="h-5 w-5 text-emerald-300" />
          <h3 className="text-lg font-semibold">Mini challenges</h3>
        </div>
        <div className="grid gap-2 md:grid-cols-2 text-sm text-white/80">
          {["Hydrate 3L x 5 days", "Sleep by 11pm x 4", "Steps 7k x 4"].map(
            (challenge) => (
              <div
                key={challenge}
                className={`${themeTokens.panel} p-3 flex items-center justify-between`}
              >
                <span>{challenge}</span>
                <button
                  className={themeTokens.buttonGhost}
                  onClick={() =>
                    setJoined((prev) =>
                      prev.includes(challenge)
                        ? prev.filter((c) => c !== challenge)
                        : [...prev, challenge]
                    )
                  }
                >
                  {joined.includes(challenge) ? "Joined" : "Join"}
                </button>
              </div>
            )
          )}
        </div>
      </section>

      <section className={`${themeTokens.card} p-4 space-y-3`}>
        <div className="flex items-center gap-2 text-white">
          <Sparkles className="h-5 w-5 text-purple-300" />
          <h3 className="text-lg font-semibold">Badges</h3>
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-white/80">
          {badges.map((badge) => (
            <span
              key={badge}
              className="rounded-full bg-white/10 px-3 py-1 border border-white/10"
            >
              {badge}
            </span>
          ))}
        </div>
        <div className={`${themeTokens.panel} p-3 space-y-2`}>
          <p className="text-sm font-semibold text-white">
            Global anonymous averages
          </p>
          <p className="text-xs text-white/60">
            Score: 69 · Sleep: 72 · Activity: 70
          </p>
        </div>
      </section>

      <section className={`${themeTokens.card} p-4 space-y-3`}>
        <div className="flex items-center gap-2 text-white">
          <Shield className="h-5 w-5 text-cyan-300" />
          <h3 className="text-lg font-semibold">Privacy & add friends</h3>
        </div>
        <div className="flex items-center gap-3 text-sm text-white/80">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={privacy}
              onChange={(e) => setPrivacy(e.target.checked)}
              className="accent-ns-gold"
            />
            Hide exact scores (share ranks only)
          </label>
          <button
            className={themeTokens.buttonGhost}
            onClick={() => setInviteStatus("Invite sent (mock)")}
          >
            <UserPlus className="mr-2 inline h-4 w-4" /> Add friend
          </button>
          <span className="text-xs text-white/60">{inviteStatus}</span>
        </div>
      </section>
    </div>
  );
}
