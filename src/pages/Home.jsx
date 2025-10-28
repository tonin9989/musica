import React from 'react'

export default function Home(){
  return (
    <div className="page home">
      <div className="home-hero card animate-fade">
        <h1 style={{margin:0}}>Bem-vindo ao <span style={{color:'var(--accent)'}}>ProSpotify</span></h1>
        <p style={{marginTop:8,color:'var(--muted)'}}>Reproduza suas músicas, gerencie playlists e escute onde quiser. Interface responsiva e pronta para deploy.</p>
        <div style={{marginTop:12}}>
          <button style={{marginRight:8}}>Explorar Biblioteca</button>
          <button>Minhas Playlists</button>
        </div>
      </div>
      <div style={{marginTop:18}} className="home-grid">
        <div className="card">Novidades</div>
        <div className="card">Top 50</div>
        <div className="card">Recomendado</div>
      </div>
    </div>
  )
}
