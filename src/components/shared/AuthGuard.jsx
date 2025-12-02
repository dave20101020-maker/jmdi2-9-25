import { api } from "@/utils/apiClient";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, LogIn, Wifi } from "lucide-react";

export default function AuthGuard({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const checkAuth = async () => {
    try {
      setError(null);
      const currentUser = await api.authMe();
      
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
      } else {
        setLoading(false);
        setError("Not authenticated");
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setLoading(false);
      setError(err.message || "Authentication failed");
    }
  };

  useEffect(() => {
    checkAuth();

    const handleOnline = () => {
      if (error) {
        checkAuth();
      }
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const handleRetry = () => {
    setLoading(true);
    setRetryCount(prev => prev + 1);
    checkAuth();
  };

  const handleSignIn = () => {
    // TODO: Implement custom login redirect/modal
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(to bottom, #0A1628, #1A1838)' }}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-[#D4AF37]" />
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] flex items-center justify-center text-3xl animate-pulse">
              ⭐
            </div>
          </div>
          <p className="text-white/60 text-base">Loading NorthStar...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'linear-gradient(to bottom, #0A1628, #1A1838)' }}>
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
            {!navigator.onLine ? (
              <Wifi className="w-10 h-10 text-red-400" />
            ) : (
              <RefreshCw className="w-10 h-10 text-red-400" />
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3">
            {!navigator.onLine ? 'You\'re Offline' : 'Connection Issue'}
          </h2>
          
          <p className="text-white/70 mb-6 text-base">
            {!navigator.onLine 
              ? 'Please check your internet connection and try again.'
              : error || 'Unable to authenticate. Please try again.'}
          </p>
          
          {retryCount > 0 && (
            <p className="text-white/50 text-sm mb-4">
              Retry attempt: {retryCount}
            </p>
          )}
          
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleRetry}
              className="btn-primary w-full py-6 text-base"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Try Again
            </Button>
            
            <Button
              onClick={handleSignIn}
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10 py-6 text-base"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // CRITICAL FIX: Pass user to children function
  return <>{typeof children === 'function' ? children(user) : children}</>;
}