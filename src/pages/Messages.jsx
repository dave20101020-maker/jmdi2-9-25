import React, { useEffect, useState } from 'react';
import AuthGuard from '@/components/shared/AuthGuard';
import { api } from '@/utils/apiClient';

function Conversation({ friend }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!friend) return;
      try {
        const res = await api.getConversation(friend._id || friend.friendId?._id || friend.id);
        if (!mounted) return;
        setMessages(res.data || res || []);
      } catch (err) {
        console.error('load convo', err);
      }
    };
    load();
    const iv = setInterval(load, 5000);
    return () => { mounted = false; clearInterval(iv); };
  }, [friend]);

  const send = async () => {
    if (!text.trim()) return;
    try {
      const fid = friend._id || friend.friendId?._id || friend.id;
      await api.sendMessage({ receiverId: fid, text });
      setText('');
      const res = await api.getConversation(fid);
      setMessages(res.data || res || []);
    } catch (err) {
      console.error('send message', err);
      alert('Failed to send');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="overflow-auto p-3" style={{ maxHeight: '60vh' }}>
        {messages.map(m => (
          <div key={m._id} className={`mb-2 ${m.senderId && m.senderId._id ? (m.senderId._id === (m.senderId._id) ? 'self' : '') : ''}`}>
            <div className="text-sm text-white/60">{m.senderId?.username || m.senderId?.full_name}</div>
            <div className="p-2 bg-white/5 rounded">{m.text}</div>
            <div className="text-xs text-white/40 mt-1">{new Date(m.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input value={text} onChange={(e)=>setText(e.target.value)} className="flex-1 p-2 rounded bg-white/5" placeholder="Type a message..." />
        <button onClick={send} className="px-4 py-2 bg-yellow-400 rounded">Send</button>
      </div>
    </div>
  );
}

function MessagesInner({ user }){
  const [friends, setFriends] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(()=>{
    const load = async ()=>{
      try{
        const f = await api.listFriends();
        setFriends(f.data || f || []);
      }catch(err){
        console.error('load friends', err);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">Messages</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h3 className="font-semibold mb-2">Friends</h3>
          <ul>
            {friends.map(f=> (
              <li key={f._id} className={`mb-2 p-2 rounded cursor-pointer ${selected && (selected._id === f.friendId?._id) ? 'bg-white/5' : 'bg-transparent' }`} onClick={()=>setSelected(f.friendId || f)}>
                <div className="font-semibold">{f.friendId?.full_name || f.friendId?.username}</div>
                <div className="text-sm text-white/60">{f.friendId?.email}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2">
          {selected ? (
            <Conversation friend={selected} />
          ) : (
            <div className="text-sm text-white/60">Select a friend to view conversation</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Messages(){
  return (
    <AuthGuard>
      {(user)=> <MessagesInner user={user} />}
    </AuthGuard>
  )
}
