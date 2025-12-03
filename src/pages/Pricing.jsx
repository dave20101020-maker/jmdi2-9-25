import React from 'react';
import { SUBSCRIPTIONS } from '@/config/subscriptions';
import { api } from '@/utils/apiClient';
import { useNavigate } from 'react-router-dom';

export default function Pricing() {
  const navigate = useNavigate();

  const handleUpgrade = async (tier) => {
    try {
      // Simulated upgrade (backend currently accepts direct upgrade)
      await api.upgradeSubscription(tier);
      // reload or navigate back to dashboard
      navigate('/');
    } catch (err) {
      console.error('Upgrade error', err);
      alert('Unable to upgrade at this time.');
    }
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">Pricing</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(SUBSCRIPTIONS).map(([key, plan]) => (
          <div key={key} className="p-6 rounded-xl border bg-white/5">
            <div className="text-lg font-bold mb-2">{plan.label}</div>
            <div className="text-2xl font-extrabold mb-4">{plan.price}</div>
            <div className="mb-4 text-sm">
              <strong>Includes:</strong>
              <ul className="mt-2 ml-4 list-disc">
                {plan.allowedPillars.map(p => <li key={p}>{p}</li>)}
              </ul>
            </div>
            <button
              onClick={() => handleUpgrade(key)}
              className="px-4 py-2 bg-yellow-400 rounded font-bold"
            >
              Upgrade to {plan.label}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
