import React, { useState, useEffect } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
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

  useEffect(()=>{
    const raw = localStorage.getItem('user')
    if(raw) setUser(JSON.parse(raw))
  },[])

  function logout(){
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    setUser(null)
    window.location.href = '/'
  }
  return (
    <div className="app">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="logo">
          <img src={logo} alt="logo" />
          <span>ProSpotify</span>
        </div>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/library">Biblioteca</Link>
          <Link to="/playlists">Playlists</Link>
          <Link to="/plans">Planos</Link>
          <Link to="/settings">Config</Link>
          {user ? (
            <>
              <div style={{padding:'8px 0',color:'var(--muted)'}}>Olá, {user.email}</div>
              <a style={{cursor:'pointer',color:'var(--accent)'}} onClick={logout}>Sair</a>
            </>
          ) : (
            <Link to="/auth">Entrar</Link>
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
          <div className="user">Plano: <strong>Free</strong></div>
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
