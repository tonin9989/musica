import React from 'react'

const sampleTracks = [
  // Brazilian selections
  { id: 'br1', title: 'Ai Se Eu Te Pego', artist: 'Michel Teló', youtubeId: 'hcm55lU9knw' },
  { id: 'br2', title: 'Vai Malandra', artist: 'Anitta', youtubeId: 'rDtsUlBya8o' },
  { id: 'br3', title: 'Trem Bala', artist: 'Ana Vilela', youtubeId: '0b1BxgUomTg' },
  // International
  { id: 'int1', title: 'Despacito', artist: 'Luis Fonsi ft. Daddy Yankee', youtubeId: 'kJQP7kiw5Fk' },
  { id: 'int2', title: 'Shape of You', artist: 'Ed Sheeran', youtubeId: 'JGwWNGJdvx8' },
  { id: 'int3', title: 'Für Elise (Beethoven) - example', artist: 'Beethoven', youtubeId: 'fOk8Tm815lE' }
]

function playTrack(t){
  // set active playlist to this single-track and currentTrack for player component
  const active = { index: 0, tracks: [t] }
  localStorage.setItem('activePlaylist', JSON.stringify(active))
  localStorage.setItem('currentTrack', JSON.stringify(t))
  // dispatch change event for Player to pick up
  window.dispatchEvent(new Event('trackChanged'))
}

export default function Home(){
  return (
    <div className="page home">
      <div className="home-hero card animate-fade">
        <h1 style={{margin:0}}>Bem-vindo ao <span style={{color:'var(--accent)'}}>ProSpotify</span></h1>
        <p style={{marginTop:8,color:'var(--muted)'}}>Reproduza suas músicas, gerencie playlists e escute onde quiser. Se quiser, as faixas abaixo são links do YouTube embutidos — clique em tocar para ouvir aqui.</p>
        <div style={{marginTop:12}}>
          <button style={{marginRight:8}}>Explorar Biblioteca</button>
          <button>Minhas Playlists</button>
        </div>
      </div>

      <div style={{marginTop:18}} className="home-grid">
        <div className="card">
          <h3>Seleções</h3>
          <ul style={{listStyle:'none',padding:0,margin:0}}>
            {sampleTracks.map(t=> (
              <li key={t.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px dashed rgba(255,255,255,0.02)'}}>
                <div>
                  <div style={{fontWeight:600}}>{t.title}</div>
                  <div style={{fontSize:13,color:'var(--muted)'}}>{t.artist}</div>
                </div>
                <div>
                  <button onClick={()=>playTrack(t)} style={{marginRight:8}}>Tocar</button>
                  <a href={`https://www.youtube.com/watch?v=${t.youtubeId}`} target="_blank" rel="noreferrer"><button>YouTube</button></a>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">Top 50</div>
        <div className="card">Recomendado</div>
      </div>
    </div>
  )
}
