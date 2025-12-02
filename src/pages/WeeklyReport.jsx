import React, { useEffect, useState } from 'react';
import { api } from '@/utils/apiClient';
import { Link } from 'react-router-dom';

export default function WeeklyReport() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchReport = async () => {
      try {
        const res = await api.getWeeklyReport();
        if (!mounted) return;
        if (res && res.success) setReport(res.data);
        else setError('No report available');
      } catch (err) {
        console.error('Weekly report fetch error', err);
        setError(err?.message || 'Failed to fetch report');
      } finally { if (mounted) setLoading(false); }
    };
    fetchReport();
    return () => { mounted = false };
  }, []);

  if (loading) return <div className="p-6">Loading weekly report…</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  const { title, summary, improvements = [], declines = [], actions = [] } = report || {};

  return (
    <div className="min-h-screen p-8 max-w-3xl mx-auto bg-white/5 rounded">
      <div className="mb-6">
        <div className="text-sm text-gray-400">From: NorthStar Weekly</div>
        <div className="text-sm text-gray-400">To: you</div>
        <div className="text-sm text-gray-400">Date: {new Date().toLocaleDateString()}</div>
      </div>

      <h1 className="text-2xl font-bold mb-4">{title || 'Weekly Report'}</h1>

      <div className="prose mb-6">
        <p>{summary}</p>
      </div>

      <div className="mb-4">
        <strong>Improvements:</strong>
        <ul className="ml-4 list-disc">
          {improvements.length ? improvements.map(i => <li key={i.pillar}>{i.pillar} (+{i.change})</li>) : <li>None</li>}
        </ul>
      </div>

      <div className="mb-4">
        <strong>Declines:</strong>
        <ul className="ml-4 list-disc">
          {declines.length ? declines.map(d => <li key={d.pillar}>{d.pillar} ({d.change})</li>) : <li>None</li>}
        </ul>
      </div>

      <div className="mb-6">
        <strong>Recommended actions:</strong>
        <ol className="ml-4 list-decimal">
          {actions.length ? actions.map((a, idx) => <li key={idx}>{a}</li>) : <li>Try adding a simple daily habit related to your weakest pillar.</li>}
        </ol>
      </div>

      <div className="flex items-center gap-4">
        <Link to="/" className="text-sm text-blue-400">Back to dashboard</Link>
      </div>
    </div>
  );
}
