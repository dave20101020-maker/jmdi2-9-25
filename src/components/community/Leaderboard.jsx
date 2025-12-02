import React, { useEffect, useState } from 'react'
import { api } from '@/lib/apiClient'
import { PILLARS } from '@/config/pillars'

export default function Leaderboard(){
  const [pillar, setPillar] = useState('sleep')
  const [list, setList] = useState([])
  const [overall, setOverall] = useState([])
  const [view, setView] = useState('pillar')
  const [loading, setLoading] = useState(false)

  useEffect(()=>{
    load()
  }, [pillar, view])

  const load = async ()=>{
    setLoading(true)
    try{
      if (view === 'pillar'){
        const res = await api.getLeaderboard(pillar)
        setList(res.data || res || [])
      } else {
        const res = await api.getOverallLeaderboard()
        setOverall(res.data || res || [])
      }
    }catch(err){
      console.error('leaderboard load', err)
    }finally{ setLoading(false) }
  }

  return (
    <div className="p-4 bg-white/5 rounded">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex gap-2">
          <button onClick={()=>setView('pillar')} className={`px-3 py-1 rounded ${view==='pillar'?'bg-yellow-400':'bg-white/5'}`}>Pillar</button>
          <button onClick={()=>setView('overall')} className={`px-3 py-1 rounded ${view==='overall'?'bg-yellow-400':'bg-white/5'}`}>Overall</button>
        </div>
        {view === 'pillar' && (
          <select value={pillar} onChange={(e)=>setPillar(e.target.value)} className="ml-auto p-2 rounded bg-black/10">
            {PILLARS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        )}
      </div>

      {loading && <div className="text-sm text-white/60">Loading...</div>}

      {view === 'pillar' && !loading && (
        <ol className="list-decimal list-inside">
          {list.map((item, idx) => (
            <li key={idx} className="p-2 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{item.user?.full_name || item.user?.username || item.user?._id}</div>
                  <div className="text-sm text-white/60">{item.user?.email}</div>
                </div>
                <div className="font-bold">{item.score}</div>
              </div>
            </li>
          ))}
        </ol>
      )}

      {view === 'overall' && !loading && (
        <ol className="list-decimal list-inside">
          {overall.map((item, idx) => (
            <li key={idx} className="p-2 border-b border-white/5 flex items-center justify-between">
              <div>
                <div className="font-semibold">{item.user?.full_name || item.user?.username || item.user?._id}</div>
                <div className="text-sm text-white/60">{item.user?.email}</div>
              </div>
              <div className="font-bold">{item.average}</div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
