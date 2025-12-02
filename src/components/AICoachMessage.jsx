import React from 'react'

export default function AICoachMessage({ message, timestamp, pillar = null, actions = [] }) {
  return (
    <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-400/30 rounded-xl p-5 shadow-lg">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
          <span className="text-xl">🤖</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-white">NorthStar AI Coach</h3>
            {timestamp && (
              <span className="text-xs text-white/60">{timestamp}</span>
            )}
          </div>
          {pillar && (
            <div className="inline-block px-2 py-1 bg-blue-400/20 text-blue-300 text-xs rounded-full mb-2">
              {pillar}
            </div>
          )}
          <p className="text-white/90 text-sm leading-relaxed">{message}</p>
        </div>
      </div>
      {actions && actions.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="text-sm font-medium text-white/70">Suggested Actions:</div>
          {actions.map((action, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 text-sm text-white/80 bg-white/5 rounded-lg p-3"
            >
              <span className="text-blue-400 font-bold">{idx + 1}.</span>
              <span>{action}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
