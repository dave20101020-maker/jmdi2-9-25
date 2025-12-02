import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

export default function Login(){
  const { login } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login(emailOrUsername, password);
      if (!res || !res.success) {
        setError(res?.error || 'Login failed');
      }
    } catch (err) {
      setError(err.message || 'Login error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white/5 rounded">
      <h1 className="text-2xl font-bold mb-4">Sign in</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm">Email or Username</label>
          <input
            className="w-full mt-1 px-3 py-2 rounded bg-white/5"
            value={emailOrUsername}
            onChange={(e)=>setEmailOrUsername(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm">Password</label>
          <input
            type="password"
            className="w-full mt-1 px-3 py-2 rounded bg-white/5"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            required
          />
        </div>

        {error && <div className="text-sm text-red-400">{error}</div>}

        <div>
          <button className="py-2 px-4 bg-blue-600 rounded text-white" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </form>
    </div>
  )
}
