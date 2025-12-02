import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/Layout/MainLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Pillar from './pages/Pillar'
import Settings from './pages/Settings'
import Pricing from './pages/Pricing'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import './App.css'

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="onboarding" element={<Onboarding />} />
            <Route path="dashboard" element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            } />
            <Route path="pillar/:pillarId" element={
              <RequireAuth>
                <Pillar />
              </RequireAuth>
            } />
            <Route path="settings" element={<Settings />} />
            <Route path="pricing" element={<Pricing />} />
          </Route>

          <Route path="*" element={<div style={{padding:20}}>404 - Not Found</div>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}