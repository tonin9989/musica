import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Library from './pages/Library'
import Playlists from './pages/Playlists'
import Plans from './pages/Plans'
import Settings from './pages/Settings'
import Auth from './pages/Auth'
import Player from './components/Player'
import logo from './logo.svg'
import Reels from './pages/Reels'

export default function App(){
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  useEffect(()=>{
    const raw = localStorage.getItem('user')
    if(raw) setUser(JSON.parse(raw))
  },[])

  // Close sidebar on route change (better UX on mobile)
  useEffect(()=>{
    setSidebarOpen(false)
  }, [location.pathname])

  function logout(){
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    setUser(null)
    window.location.href = '/'
  }
  return (
    <div className="app">
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={()=>setSidebarOpen(false)} aria-hidden="true" />
      )}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="logo">
          <img src={logo} alt="logo" />
          <span>ProSpotify</span>
        </div>
        <nav>
          <Link to="/" onClick={()=>setSidebarOpen(false)}>Home</Link>
          <Link to="/library" onClick={()=>setSidebarOpen(false)}>Biblioteca</Link>
          <Link to="/playlists" onClick={()=>setSidebarOpen(false)}>Playlists</Link>
          <Link to="/plans" onClick={()=>setSidebarOpen(false)}>Planos</Link>
          <Link to="/settings" onClick={()=>setSidebarOpen(false)}>Config</Link>
          {user ? (
            <>
              <div style={{padding:'8px 0',color:'var(--muted)'}}>Olá, {user.email}</div>
              <a style={{cursor:'pointer',color:'var(--accent)'}} onClick={logout}>Sair</a>
            </>
          ) : (
            <Link to="/auth" onClick={()=>setSidebarOpen(false)}>Entrar</Link>
          )}
        </nav>
      </aside>
      <div className="content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="hamburger" onClick={()=>setSidebarOpen(s=>!s)} aria-label="Abrir menu">☰</button>
            <div className="search">
              <input placeholder="Pesquisar músicas, artistas ou playlists..." />
            </div>
          </div>
          <div className="user">Plano: <strong>{user?.plan || 'Free'}</strong></div>
        </header>
        <main className="main">
          <Routes>
            <Route path="/" element={<Home/>} />
            <Route path="/library" element={<Library/>} />
            <Route path="/playlists" element={<Playlists/>} />
            <Route path="/reels" element={<Reels/>} />
            <Route path="/plans" element={<Plans/>} />
            <Route path="/settings" element={<Settings/>} />
            <Route path="/auth" element={<Auth/>} />
          </Routes>
        </main>
      </div>
      <Player />
    </div>
  )
}
