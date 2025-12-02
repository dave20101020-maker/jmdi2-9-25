import React, { useEffect, useState } from 'react'

export default function ApiErrorToast(){
  const [message, setMessage] = useState(null)

  useEffect(()=>{
    const handler = (e) => setMessage(e.detail || 'API error')
    window.addEventListener('api-error', handler)
    return () => window.removeEventListener('api-error', handler)
  }, [])

  if (!message) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-red-600 text-white p-3 rounded shadow">
        <div className="font-semibold">Error</div>
        <div className="text-sm">{message}</div>
        <button className="mt-2 underline" onClick={()=>setMessage(null)}>Dismiss</button>
      </div>
    </div>
  )
}
