import React, { useEffect, useState } from 'react';
import AuthGuard from '@/components/shared/AuthGuard';
import { api } from '@/utils/apiClient';

function NotificationsInner(){
  const [data, setData] = useState({ unread: [], read: [] });

  const load = async ()=>{
    try{
      const res = await api.getNotifications();
      setData(res.data || res || { unread: [], read: [] });
    }catch(err){ console.error('load notifications', err); }
  }

  useEffect(()=>{ load() }, []);

  const markAll = async ()=>{
    try{
      await api.markNotificationsRead({ all: true });
      load();
    }catch(e){ console.error(e); }
  }

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <div>
          <button onClick={markAll} className="px-3 py-1 bg-yellow-400 rounded">Mark all read</button>
        </div>
      </div>

      <section className="mb-6">
        <h3 className="font-semibold mb-2">Unread</h3>
        {data.unread.length === 0 && <div className="text-sm text-white/60">No unread notifications</div>}
        <ul>
          {data.unread.map(n => (
            <li key={n._id} className="mb-2 p-3 bg-white/5 rounded">
              <div className="font-semibold">{n.title}</div>
              <div className="text-sm text-white/60">{n.message}</div>
              <div className="text-xs text-white/40 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="font-semibold mb-2">Read</h3>
        {data.read.length === 0 && <div className="text-sm text-white/60">No read notifications</div>}
        <ul>
          {data.read.map(n => (
            <li key={n._id} className="mb-2 p-3 bg-white/6 rounded">
              <div className="font-semibold">{n.title}</div>
              <div className="text-sm text-white/60">{n.message}</div>
              <div className="text-xs text-white/40 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default function Notifications(){
  return (
    <AuthGuard>
      {() => <NotificationsInner />}
    </AuthGuard>
  );
}
