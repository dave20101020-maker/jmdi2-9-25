import React, { useEffect, useState } from 'react';
import AuthGuard from '@/components/shared/AuthGuard';
import { api } from '@/utils/apiClient';

function EventCard({ e }){
  return (
    <div className="mb-3 p-4 bg-white/5 rounded">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-semibold">{e.type.replace(/-/g,' ')}</div>
          <div className="text-sm text-white/60">{e.pillarId ? e.pillarId : ''}</div>
        </div>
        <div className="text-xs text-white/40">{new Date(e.date).toLocaleString()}</div>
      </div>
      {e.value !== null && e.value !== undefined && (
        <div className="mt-2 text-sm">Value: {e.value}</div>
      )}
      {e.note && <div className="mt-2 text-sm text-white/60">{e.note}</div>}
    </div>
  );
}

function TimelineInner(){
  const [events, setEvents] = useState([]);

  useEffect(()=>{
    let mounted = true;
    const load = async ()=>{
      try{
        const res = await api.getTimeline();
        if (!mounted) return;
        setEvents(res.data || res || []);
      }catch(err){ console.error('load timeline', err); }
    }
    load();
    return ()=> mounted = false;
  }, []);

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">Timeline</h1>
      <div className="space-y-4">
        {events.length === 0 && <div className="text-sm text-white/60">No activity in the last 30 days.</div>}
        {events.map((e, idx) => <EventCard key={idx} e={e} />)}
      </div>
    </div>
  );
}

export default function Timeline(){
  return (
    <AuthGuard>
      {() => <TimelineInner />}
    </AuthGuard>
  );
}
