import React from 'react'
import { Link, Outlet } from 'react-router-dom'
import { PILLARS } from '@/config/pillars'

export default function MainLayout(){
  return (
    <div style={{display:'flex',minHeight:'100vh',fontFamily:'system-ui,Arial'}}>
      <aside style={{width:220,background:'#0b1220',color:'#fff',padding:16}}>
        <h2 style={{marginTop:0}}>NorthStar</h2>
        <nav style={{marginTop:16}}>
          <Link to="/dashboard" style={{color:'#fff',display:'block',marginBottom:8}}>Dashboard</Link>
          <Link to="/onboarding" style={{color:'#fff',display:'block',marginBottom:8}}>Onboarding</Link>
          <Link to="/pricing" style={{color:'#fff',display:'block',marginBottom:8}}>Pricing</Link>
          <Link to="/settings" style={{color:'#fff',display:'block',marginBottom:8}}>Settings</Link>
        </nav>

        <div style={{marginTop:24}}>
          <h4 style={{margin:'8px 0'}}>Pillars</h4>
          <ul style={{listStyle:'none',padding:0,margin:0}}>
            {PILLARS.map(p=> (
              <li key={p.id} style={{marginBottom:6}}>
                <Link to={`/pillar/${p.id}`} style={{color:'#cbd5e1',display:'flex',alignItems:'center'}}>
                  <span className={`${p.color} inline-block w-3 h-3 mr-2 rounded`} />
                  <span>{p.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div style={{flex:1,display:'flex',flexDirection:'column'}}>
        <header style={{height:64,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 20px',borderBottom:'1px solid #eee'}}>
          <div style={{fontWeight:700}}>Top Nav</div>
          <div>
            <Link to="/login" style={{marginRight:12}}>Login</Link>
            <Link to="/register">Register</Link>
          </div>
        </header>

        <main style={{flex:1,padding:24,background:'#f7fafc'}}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
