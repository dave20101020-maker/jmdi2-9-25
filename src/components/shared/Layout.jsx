import { api } from "@/utils/apiClient";
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PILLARS, getPillarsArray, COLORS, createPageUrl } from "@/utils";
import {
  Home,
  TrendingUp,
  MessageCircle,
  User,
  Plus,
  Target,
  Users,
  Trophy,
  Flame,
  Bell,
} from "lucide-react";
import { format } from "date-fns";

function PillarSelector({ onClose, onSelect }) {
  const pillarsArray = getPillarsArray();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#0A1628] bg-opacity-95 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="h-full overflow-y-auto pb-20 pt-6 px-4 sm:px-6 safe-bottom">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Track a Pillar
            </h2>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white text-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] focus-visible:outline-offset-2 rounded-lg p-3 transition-all hover:scale-110 active:scale-95 haptic-ready"
              aria-label="Close pillar selection"
            >
              &times;
            </button>
          </div>

          <div className="space-y-3">
            {pillarsArray.map((pillar, idx) => (
              <button
                key={pillar.id}
                onClick={() => onSelect(pillar.id)}
                className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all duration-200 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] focus-visible:outline-offset-2 group haptic-ready"
                style={{
                  boxShadow: `0 0 20px ${pillar.color}40`,
                  animationDelay: `${idx * 50}ms`,
                }}
                aria-label={`Track ${pillar.name}`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl transition-all duration-300 group-hover:scale-110 group-active:scale-100"
                    style={{
                      backgroundColor: `${pillar.color}20`,
                      boxShadow: `0 0 15px ${pillar.color}60`,
                    }}
                    aria-hidden="true"
                  >
                    {pillar.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-semibold text-white transition-colors group-hover:text-white">
                      {pillar.name}
                    </h3>
                    <p className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
                      Quick log &rarr;
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BottomNav() {
  const location = useLocation();
  const [showPillarSelector, setShowPillarSelector] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const today = new Date();
    const isSunday = today.getDay() === 0;
    const hasSeenPromptToday =
      sessionStorage.getItem("reflectionPromptShown") ===
      format(today, "yyyy-MM-dd");

    if (
      isSunday &&
      !hasSeenPromptToday &&
      location.pathname === createPageUrl("Dashboard")
    ) {
      setTimeout(() => {
        const shouldShowReflection = window.confirm(
          "🌟 Weekly Reflection Time!\n\nHow did your plans go this week? Take a moment to reflect on what worked and what didn't.\n\nWould you like to complete your weekly reflection now?"
        );

        if (shouldShowReflection) {
          navigate(createPageUrl("WeeklyReflection"));
        }

        sessionStorage.setItem(
          "reflectionPromptShown",
          format(today, "yyyy-MM-dd")
        );
      }, 2000);
    }
  }, [location.pathname, navigate]);

  const navItems = [
    {
      icon: Home,
      label: "Home",
      path: createPageUrl("Dashboard"),
      ariaLabel: "Go to home dashboard",
    },
    {
      icon: Trophy,
      label: "Growth",
      path: createPageUrl("MyGrowth"),
      ariaLabel: "View growth goals and plans",
    },
    {
      icon: Plus,
      label: "Track",
      path: null,
      action: () => setShowPillarSelector(true),
      ariaLabel: "Track a pillar",
    },
    {
      icon: TrendingUp,
      label: "Insights",
      path: createPageUrl("Analytics"),
      ariaLabel: "View analytics and insights",
    },
    {
      icon: User,
      label: "Profile",
      path: createPageUrl("Profile"),
      ariaLabel: "View your profile",
    },
  ];

  const handlePillarSelect = (pillarId) => {
    setShowPillarSelector(false);
    navigate(createPageUrl("Track") + `?pillar=${pillarId}`);
  };

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-lg border-t border-white/10 safe-bottom"
        style={{ backgroundColor: `${COLORS.BACKGROUND}CC` }}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-md mx-auto px-2 py-2">
          <div className="flex justify-around items-center">
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = item.path && location.pathname === item.path;
              const isMiddle = idx === 2;

              if (item.action) {
                return (
                  <button
                    key={item.label}
                    onClick={item.action}
                    aria-label={item.ariaLabel}
                    className="flex flex-col items-center gap-1 p-3 relative group focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] focus-visible:outline-offset-2 rounded-lg transition-all hover:scale-110 active:scale-95 haptic-ready"
                  >
                    <div
                      className={`${
                        isMiddle
                          ? "w-14 h-14 -mt-6 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110 group-active:scale-95"
                          : ""
                      }`}
                      style={
                        isMiddle
                          ? {
                              background: `linear-gradient(to bottom right, ${COLORS.PRIMARY}, ${COLORS.PRIMARY_LIGHT})`,
                              boxShadow: `0 0 20px ${COLORS.PRIMARY}80`,
                            }
                          : {}
                      }
                    >
                      <Icon
                        className={`${
                          isMiddle
                            ? "w-7 h-7"
                            : "w-6 h-6 text-white/60 group-hover:text-white"
                        } transition-colors`}
                        style={isMiddle ? { color: COLORS.BACKGROUND } : {}}
                        aria-hidden="true"
                      />
                    </div>
                    {!isMiddle && (
                      <span className="text-xs text-white/60 group-hover:text-white transition-colors">
                        {item.label}
                      </span>
                    )}
                  </button>
                );
              }

              return (
                <Link
                  key={item.label}
                  to={item.path}
                  aria-label={item.ariaLabel}
                  aria-current={isActive ? "page" : undefined}
                  className="flex flex-col items-center gap-1 p-3 relative group focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] focus-visible:outline-offset-2 rounded-lg transition-all hover:scale-105 active:scale-95 haptic-ready"
                >
                  <Icon
                    className={`w-6 h-6 transition-all duration-200`}
                    style={{
                      color: isActive
                        ? COLORS.PRIMARY
                        : "rgba(255,255,255,0.6)",
                    }}
                    aria-hidden="true"
                  />
                  <span
                    className={`text-xs transition-all duration-200`}
                    style={{
                      color: isActive
                        ? COLORS.PRIMARY
                        : "rgba(255,255,255,0.6)",
                    }}
                  >
                    {item.label}
                  </span>
                  {isActive && (
                    <div
                      className="absolute -top-1 w-1 h-1 rounded-full animate-pulse"
                      style={{
                        backgroundColor: COLORS.PRIMARY,
                        boxShadow: `0 0 8px ${COLORS.PRIMARY}CC`,
                      }}
                      aria-hidden="true"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {showPillarSelector && (
        <PillarSelector
          onClose={() => setShowPillarSelector(false)}
          onSelect={handlePillarSelect}
        />
      )}
    </>
  );
}

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    async function checkAuth() {
      try {
        const currentUser = await api.authMe();

        if (!currentUser) {
          setLoading(false);
          return;
        }

        setUser(currentUser);

        if (
          !currentUser.onboarding_completed &&
          !location.pathname.includes("Onboarding")
        ) {
          navigate(createPageUrl("Onboarding"));
        }
      } catch (error) {
        console.error("Auth error:", error);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [location.pathname, navigate]);

  // notifications count
  const [notificationsCount, setNotificationsCount] = useState(0);
  useEffect(() => {
    let mounted = true;
    const loadNotifications = async () => {
      try {
        const res = await api.getNotifications();
        if (!mounted) return;
        const unread = res.data && res.data.unread ? res.data.unread.length : 0;
        setNotificationsCount(unread);
      } catch (e) {
        // ignore
      }
    };
    loadNotifications();
    const iv = setInterval(loadNotifications, 15_000);
    return () => {
      mounted = false;
      clearInterval(iv);
    };
  }, []);

  useEffect(() => {
    const metaViewport = document.querySelector('meta[name="viewport"]');
    if (metaViewport) {
      metaViewport.setAttribute(
        "content",
        "width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover"
      );
    }

    let metaTheme = document.querySelector('meta[name="theme-color"]');
    if (!metaTheme) {
      metaTheme = document.createElement("meta");
      metaTheme.name = "theme-color";
      document.head.appendChild(metaTheme);
    }
    metaTheme.content = COLORS.BACKGROUND;

    let metaApple = document.querySelector(
      'meta[name="apple-mobile-web-app-capable"]'
    );
    if (!metaApple) {
      metaApple = document.createElement("meta");
      metaApple.name = "apple-mobile-web-app-capable";
      metaApple.content = "yes";
      document.head.appendChild(metaApple);
    }

    let metaStatusBar = document.querySelector(
      'meta[name="apple-mobile-web-app-status-bar-style"]'
    );
    if (!metaStatusBar) {
      metaStatusBar = document.createElement("meta");
      metaStatusBar.name = "apple-mobile-web-app-status-bar-style";
      metaStatusBar.content = "black-translucent";
      document.head.appendChild(metaStatusBar);
    }
  }, []);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: `linear-gradient(to bottom, ${COLORS.BACKGROUND}, #1A1838)`,
        }}
      >
        <div className="text-white text-center">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-20"
              style={{ backgroundColor: COLORS.PRIMARY }}
            ></div>
            <div
              className="relative w-16 h-16 rounded-full flex items-center justify-center text-3xl pulse-glow"
              style={{
                background: `linear-gradient(to bottom right, ${COLORS.PRIMARY}, ${COLORS.PRIMARY_LIGHT})`,
              }}
            >
              ⭐
            </div>
          </div>
          <p className="text-white/60">Loading NorthStar...</p>
        </div>
      </div>
    );
  }

  const isOnboarding = location.pathname.includes("Onboarding");

  // Generate shooting star trajectories
  const shootingStars = [
    // Star 1: Top-left to bottom-right
    {
      startX: "10%",
      startY: "-5%",
      endX: "calc(100% + 50px)",
      endY: "calc(100% + 50px)",
      angle: 45,
      delay: 3,
      duration: 3.5,
    },
    // Star 2: Right to left
    {
      startX: "calc(100% + 50px)",
      startY: "30%",
      endX: "-50px",
      endY: "30%",
      angle: 180,
      delay: 12,
      duration: 4,
    },
    // Star 3: Top-right to bottom-left
    {
      startX: "90%",
      startY: "-5%",
      endX: "-50px",
      endY: "calc(100% + 50px)",
      angle: 135,
      delay: 20,
      duration: 3.8,
    },
  ];

  return (
    <div
      className="min-h-screen relative overflow-hidden safe-top safe-bottom safe-left safe-right"
      style={{
        background: `linear-gradient(to bottom, ${COLORS.BACKGROUND}, #1A1838)`,
      }}
    >
      {/* Cosmic Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
        <div className="stars-container absolute inset-0">
          {[...Array(100)].map((_, i) => (
            <div
              key={i}
              className="star absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.7 + 0.3,
                animation: `twinkle ${Math.random() * 3 + 2}s infinite ${
                  Math.random() * 2
                }s`,
              }}
            />
          ))}
        </div>

        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>

        {/* Shooting Stars */}
        {shootingStars.map((star, i) => (
          <div
            key={i}
            className="shooting-star absolute"
            style={{
              width: "2px",
              height: "80px",
              background: `linear-gradient(to bottom, transparent, ${COLORS.PRIMARY})`,
              transform: `rotate(${star.angle}deg)`,
              left: star.startX,
              top: star.startY,
              boxShadow: `0 0 8px ${COLORS.PRIMARY}`,
              animation: `shoot-${i} ${star.duration}s linear infinite ${star.delay}s`,
              "--start-x": star.startX,
              "--start-y": star.startY,
              "--end-x": star.endX,
              "--end-y": star.endY,
            }}
          />
        ))}
      </div>

      {!isOnboarding && user && (
        <header
          className="fixed top-0 left-0 right-0 z-30 backdrop-blur-lg border-b border-white/10 safe-top"
          style={{ backgroundColor: `${COLORS.BACKGROUND}CC` }}
          role="banner"
        >
          <div className="max-w-md mx-auto px-4 sm:px-6 py-2 flex items-center justify-between">
            <div
              className="flex items-center gap-3 sm:gap-4"
              role="status"
              aria-label="User stats"
            >
              <div className="flex items-center gap-1 group">
                <Trophy
                  className="w-4 h-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                  style={{ color: COLORS.PRIMARY }}
                  aria-hidden="true"
                />
                <span
                  className="text-sm font-bold transition-colors"
                  style={{ color: COLORS.PRIMARY_LIGHT }}
                >
                  {user.points || 0}
                </span>
                <span className="text-xs text-white/60">pts</span>
              </div>
              {user.streak_days > 0 && (
                <>
                  <div
                    className="w-px h-4 bg-white/20"
                    aria-hidden="true"
                  ></div>
                  <div className="flex items-center gap-1 group">
                    <Flame
                      className="w-4 h-4 text-orange-400 transition-all duration-300 group-hover:scale-110"
                      aria-hidden="true"
                    />
                    <span className="text-sm font-bold text-orange-400">
                      {user.streak_days}
                    </span>
                    <span className="text-xs text-white/60">
                      day{user.streak_days !== 1 ? "s" : ""}
                    </span>
                  </div>
                </>
              )}
            </div>
            <div className="text-xs text-white/40">
              {user.full_name?.split(" ")[0] || "Traveler"}
            </div>
            <div>
              <Link
                to="/notifications"
                className="relative inline-flex items-center p-2 rounded hover:bg-white/3"
              >
                <Bell className="w-5 h-5 text-white/80" />
                {notificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs rounded-full bg-red-500 text-white">
                    {notificationsCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </header>
      )}

      <main
        className="relative z-10 min-h-screen pb-20"
        style={!isOnboarding && user ? { paddingTop: "3rem" } : {}}
      >
        {children}
      </main>

      {!isOnboarding && (
        <div className="md:hidden">
          <BottomNav />
        </div>
      )}

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        
        @keyframes shoot-0 {
          0% {
            opacity: 0;
            left: 10%;
            top: -5%;
          }
          5% {
            opacity: 1;
          }
          95% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            left: calc(100% + 50px);
            top: calc(100% + 50px);
          }
        }
        
        @keyframes shoot-1 {
          0% {
            opacity: 0;
            left: calc(100% + 50px);
            top: 30%;
          }
          5% {
            opacity: 1;
          }
          95% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            left: -50px;
            top: 30%;
          }
        }
        
        @keyframes shoot-2 {
          0% {
            opacity: 0;
            left: 90%;
            top: -5%;
          }
          5% {
            opacity: 1;
          }
          95% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            left: -50px;
            top: calc(100% + 50px);
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
          
          .animate-pulse,
          .animate-spin,
          .shooting-star,
          .star {
            animation: none !important;
          }
        }
        
        .star {
          pointer-events: none;
        }
        
        html {
          scroll-behavior: smooth;
        }
        
        @media (prefers-reduced-motion: reduce) {
          html {
            scroll-behavior: auto;
          }
        }
        
        ::-webkit-scrollbar {
          width: 0px;
          background: transparent;
        }
      `}</style>
    </div>
  );
}
