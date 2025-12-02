import React, { useEffect, useState } from 'react'
import AuthGuard from '@/components/shared/AuthGuard'
import { api } from '@/utils/apiClient'
import Leaderboard from '@/components/community/Leaderboard'

function CommunityInner({ user }){
  const [tab, setTab] = useState('friends')
  const [pending, setPending] = useState([])
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(false)
  const [identifier, setIdentifier] = useState('')
  const [challenges, setChallenges] = useState([])
  const [newChallenge, setNewChallenge] = useState({ pillarId: 'sleep', goalType: 'consistency', targetValue: 7, startDate: '', endDate: '' })

  const load = async ()=>{
    setLoading(true)
    try{
      const p = await api.listPendingFriendRequests()
      const f = await api.listFriends()
      const myCh = await api.getMyChallenges()
      setPending(p.data || p || [])
      setFriends(f.data || f || [])
      setChallenges(myCh.data || myCh || [])
    }catch(err){
      console.error('community load', err)
    }finally{ setLoading(false) }
  }

  useEffect(()=>{ load() }, [])

  const send = async ()=>{
    if (!identifier) return alert('Enter email or username')
    try{
      await api.sendFriendRequest({ friendId: identifier })
      setIdentifier('')
      load()
    }catch(err){
      console.error('send friend', err)
      alert(err?.error || err?.message || 'Failed to send')
    }
  }

  const accept = async (requestId, requesterId)=>{
    try{
      await api.acceptFriendRequest({ requestId, requesterId })
      load()
    }catch(err){
      console.error('accept', err)
      alert('Unable to accept')
    }
  }

  const createChallenge = async () => {
    try {
      // basic validation
      if (!newChallenge.startDate || !newChallenge.endDate) return alert('Start and end dates required');
      await api.createChallenge(newChallenge);
      setNewChallenge({ pillarId: 'sleep', goalType: 'consistency', targetValue: 7, startDate: '', endDate: '' });
      load();
    } catch (err) {
      console.error('create challenge', err);
      alert('Unable to create challenge');
    }
  }

  const join = async (id) => {
    try {
      await api.joinChallenge(id);
      load();
    } catch (err) {
      console.error('join challenge', err);
      alert('Unable to join');
    }
  }

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">Community</h1>
      <div className="mb-4">
        <div className="flex gap-2">
          <button onClick={()=>setTab('friends')} className={`px-3 py-1 rounded ${tab==='friends'?'bg-yellow-400':'bg-white/5'}`}>Friends</button>
          <button onClick={()=>setTab('leaderboards')} className={`px-3 py-1 rounded ${tab==='leaderboards'?'bg-yellow-400':'bg-white/5'}`}>Leaderboards</button>
          <button onClick={()=>setTab('challenges')} className={`px-3 py-1 rounded ${tab==='challenges'?'bg-yellow-400':'bg-white/5'}`}>Challenges</button>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold">Add Friend</h3>
        <div className="flex gap-2 mt-2">
          <input value={identifier} onChange={(e)=>setIdentifier(e.target.value)} placeholder="email or username" className="p-2 rounded bg-white/5 flex-1" />
          <button onClick={send} className="px-4 py-2 bg-yellow-400 rounded font-bold">Add friend</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tab === 'leaderboards' ? (
          <div className="md:col-span-2">
            <Leaderboard />
          </div>
        ) : tab === 'challenges' ? (
          <div className="md:col-span-2">
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Create Challenge</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <select value={newChallenge.pillarId} onChange={(e)=>setNewChallenge({...newChallenge,pillarId:e.target.value})} className="p-2 bg-white/5 rounded">
                  <option value="sleep">Sleep</option>
                  <option value="diet">Diet</option>
                  <option value="exercise">Exercise</option>
                  <option value="mental_health">Mental Health</option>
                </select>
                <select value={newChallenge.goalType} onChange={(e)=>setNewChallenge({...newChallenge,goalType:e.target.value})} className="p-2 bg-white/5 rounded">
                  <option value="consistency">Consistency</option>
                  <option value="score">Score</option>
                  <option value="actions">Actions</option>
                </select>
                <input type="number" value={newChallenge.targetValue} onChange={(e)=>setNewChallenge({...newChallenge,targetValue: Number(e.target.value)})} className="p-2 bg-white/5 rounded" />
                <div className="flex gap-2">
                  <input type="date" value={newChallenge.startDate} onChange={(e)=>setNewChallenge({...newChallenge,startDate:e.target.value})} className="p-2 bg-white/5 rounded" />
                  <input type="date" value={newChallenge.endDate} onChange={(e)=>setNewChallenge({...newChallenge,endDate:e.target.value})} className="p-2 bg-white/5 rounded" />
                </div>
              </div>
              <div className="mt-3">
                <button onClick={createChallenge} className="px-4 py-2 bg-yellow-400 rounded font-bold">Create</button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Your Challenges</h3>
              {challenges.length === 0 && <div className="text-sm text-white/60">No challenges yet</div>}
              <ul>
                {challenges.map(c => (
                  <li key={c.id} className="mb-3 p-3 bg-white/5 rounded">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold">{c.pillarId} • {c.goalType}</div>
                        <div className="text-sm text-white/60">{new Date(c.startDate).toLocaleDateString()} → {new Date(c.endDate).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <button onClick={()=>join(c.id)} className="px-3 py-1 bg-green-500 rounded text-sm">Join</button>
                      </div>
                    </div>
                    <div className="text-sm text-white/60 mt-2">Progress: {Array.isArray(c.progress) ? c.progress.length : (c.average || 0)}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <>
            <div>
              <h3 className="font-semibold mb-2">Pending Requests</h3>
              {loading && <div className="text-sm text-white/60">Loading...</div>}
              {!loading && pending.length === 0 && <div className="text-sm text-white/70">No pending requests</div>}
              <ul className="mt-2">
                {pending.map(r => (
                  <li key={r._id} className="mb-2 p-3 bg-white/5 rounded">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{r.userId?.full_name || r.userId?.username || r.userId?.email}</div>
                        <div className="text-sm text-white/60">{r.userId?.email}</div>
                      </div>
                      <div>
                        <button onClick={()=>accept(r._id, r.userId?._id)} className="px-3 py-1 bg-green-500 rounded text-sm">Accept</button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Friends</h3>
              {loading && <div className="text-sm text-white/60">Loading...</div>}
              {!loading && friends.length === 0 && <div className="text-sm text-white/70">No friends yet</div>}
              <ul className="mt-2">
                {friends.map(f => (
                  <li key={f._id} className="mb-2 p-3 bg-white/5 rounded">
                    <div className="font-semibold">{f.friendId?.full_name || f.friendId?.username || f.friendId?.email}</div>
                    <div className="text-sm text-white/60">{f.friendId?.email}</div>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function Community(){
  return (
    <AuthGuard>
      {(user) => <CommunityInner user={user} />}
    </AuthGuard>
  )
}
