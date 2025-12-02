import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/utils/apiClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchMe = async () => {
    try {
      setLoading(true);
      const res = await api.authMe();
      if (res && res.success && res.data) {
        setUser(res.data);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const login = async (emailOrUsername, password) => {
    const res = await api.authLogin(emailOrUsername, password);
    if (res && res.success) {
      // Ensure we have the latest user data and decide redirect
      await fetchMe();
      const u = res.data || null;
      const me = (await api.authMe()).data;
      const createdAt = me?.createdAt ? new Date(me.createdAt).getTime() : 0;
      const isFirstTime = Date.now() - createdAt < 10000; // created within 10s
      setUser(me || u);
      navigate(isFirstTime ? '/onboarding' : '/dashboard', { replace: true });
      return { success: true };
    }
    return res;
  };

  const register = async (username, email, password) => {
    const res = await api.authRegister({ username, email, password });
    if (res && res.success) {
      // newly registered -> go to onboarding
      await fetchMe();
      setUser(res.data);
      navigate('/onboarding', { replace: true });
      return { success: true };
    }
    return res;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // ignore
    }
    setUser(null);
    navigate('/login', { replace: true });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
