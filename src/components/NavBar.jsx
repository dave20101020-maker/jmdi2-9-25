import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import NSButton from "@/components/ui/NSButton";

export default function NavBar() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const [ctaLoading, setCtaLoading] = useState(false);
  const displayName =
    user?.fullName || user?.displayName || user?.username || user?.email;

  const navItems = useMemo(
    () => [
      { path: "/dashboard", label: "Dashboard", icon: "🏠" },
      { path: "/settings", label: "Settings", icon: "⚙️" },
    ],
    []
  );

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await signOut();
      toast.success("Signed out");
      navigate("/login", { replace: true });
    } catch (error) {
      const message = error?.message || "Could not sign out";
      toast.error("Sign-out failed", { description: message });
    } finally {
      setSigningOut(false);
    }
  };

  const handleDailyFocus = async () => {
    if (!user) {
      toast.error("Please sign in to start your focus session.");
      navigate("/login", { replace: true, state: { from: location } });
      return;
    }
    setCtaLoading(true);
    try {
      navigate("/dashboard", { replace: false });
      toast.success("Daily Focus launched");
    } catch (error) {
      const message = error?.message || "Could not start Daily Focus.";
      toast.error("Action failed", { description: message });
    } finally {
      setCtaLoading(false);
    }
  };

  return (
    <nav className="bg-[#1a1f35] border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold text-yellow-400">
              ⭐ NorthStar
            </Link>
            {user && (
              <div className="hidden md:flex items-center gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? "bg-yellow-400/20 text-yellow-400"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="hidden sm:inline text-sm text-white/70">
                  {displayName}
                </span>
                <NSButton
                  to="/dashboard"
                  variant="secondary"
                  analyticsPage="navbar"
                  analyticsLabel="Dashboard"
                  className="hidden sm:inline-flex"
                >
                  Dashboard
                </NSButton>
                <NSButton
                  onClick={handleDailyFocus}
                  loading={ctaLoading}
                  disabled={ctaLoading}
                  analyticsPage="navbar"
                  analyticsLabel="Daily Focus"
                >
                  {ctaLoading ? "Launching..." : "Daily Focus"}
                </NSButton>
                <NSButton
                  onClick={handleLogout}
                  loading={signingOut}
                  disabled={signingOut}
                  variant="ghost"
                  analyticsPage="navbar"
                  analyticsLabel="Logout"
                >
                  {signingOut ? "Signing out..." : "Logout"}
                </NSButton>
              </>
            ) : (
              <>
                <NSButton
                  to="/login"
                  variant="ghost"
                  analyticsPage="navbar"
                  analyticsLabel="Login"
                >
                  Login
                </NSButton>
                <NSButton
                  to="/register"
                  analyticsPage="navbar"
                  analyticsLabel="Register"
                >
                  Register
                </NSButton>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
