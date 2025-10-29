import React from 'react'

const sampleTracks = [
  // Brazilian selections
  { id: 'br1', title: 'Ai Se Eu Te Pego', artist: 'Michel Teló', youtubeId: 'hcm55lU9knw', image: 'https://i.ytimg.com/vi/hcm55lU9knw/maxresdefault.jpg' },
  { id: 'br2', title: 'Vai Malandra', artist: 'Anitta', youtubeId: 'rDtsUlBya8o', image: 'https://i.ytimg.com/vi/rDtsUlBya8o/maxresdefault.jpg' },
  { id: 'br3', title: 'Trem Bala', artist: 'Ana Vilela', youtubeId: '0b1BxgUomTg', image: 'https://i.ytimg.com/vi/0b1BxgUomTg/maxresdefault.jpg' },
  { id: 'br4', title: 'Evidências', artist: 'Chitãozinho e Xororó', youtubeId: 'ePrdmW_NXx4', image: 'https://i.ytimg.com/vi/ePrdmW_NXx4/maxresdefault.jpg' },
  { id: 'br5', title: 'Garota de Ipanema', artist: 'Tom Jobim', youtubeId: '8jY8I7A_pJM', image: 'https://i.ytimg.com/vi/8jY8I7A_pJM/maxresdefault.jpg' },
  { id: 'br6', title: 'Aquarela', artist: 'Toquinho', youtubeId: 'fJ9GWO4T5Z0', image: 'https://i.ytimg.com/vi/fJ9GWO4T5Z0/maxresdefault.jpg' },
  // International
  { id: 'int1', title: 'Despacito', artist: 'Luis Fonsi ft. Daddy Yankee', youtubeId: 'kJQP7kiw5Fk', image: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/maxresdefault.jpg' },
  { id: 'int2', title: 'Shape of You', artist: 'Ed Sheeran', youtubeId: 'JGwWNGJdvx8', image: 'https://i.ytimg.com/vi/JGwWNGJdvx8/maxresdefault.jpg' },
  { id: 'int3', title: 'Blinding Lights', artist: 'The Weeknd', youtubeId: 'fHI8X4OXluQ', image: 'https://i.ytimg.com/vi/fHI8X4OXluQ/maxresdefault.jpg' },
  { id: 'int4', title: 'Bohemian Rhapsody', artist: 'Queen', youtubeId: 'fJ9rUzIMcZQ', image: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/maxresdefault.jpg' },
  { id: 'int5', title: 'Someone Like You', artist: 'Adele', youtubeId: 'hLQl3WQQoQ0', image: 'https://i.ytimg.com/vi/hLQl3WQQoQ0/maxresdefault.jpg' },
  { id: 'int6', title: 'Imagine', artist: 'John Lennon', youtubeId: 'YkgkThdzX-8', image: 'https://i.ytimg.com/vi/YkgkThdzX-8/maxresdefault.jpg' },
]

function playTrack(t){
  try{
    // create a minimal, safe track object for storage (avoid unexpected fields)
    const safe = {
      title: t.title || 'Untitled',
      artist: t.artist || t.artist || '',
    }
    if(t.youtubeId) safe.youtubeId = t.youtubeId
    else if(t.src) safe.src = t.src

    const active = { name: 'Seleções', index: 0, tracks: [safe] }
    localStorage.setItem('activePlaylist', JSON.stringify(active))
    localStorage.setItem('currentTrack', JSON.stringify(safe))
    // dispatch change event for Player to pick up
    try{ window.dispatchEvent(new Event('trackChanged')) }catch(e){ /* ignore */ }
  }catch(err){
    console.error('playTrack error', err)
    alert('Erro ao tentar reproduzir a faixa')
  }
}

export default function Home(){
  return (
    <div className="page home">
      <div className="home-hero card animate-fade">
        <h1 style={{margin:0}}>Bem-vindo ao <span style={{color:'var(--accent)'}}>ProMusics</span></h1>
        <p style={{marginTop:8,color:'var(--muted)'}}>Reproduza suas músicas, gerencie playlists e escute onde quiser. As faixas abaixo são do YouTube — clique em tocar para ouvir aqui.</p>
        <div style={{marginTop:12}}>
          <button style={{marginRight:8}} onClick={()=>window.location.href='/library'}>Explorar Biblioteca</button>
          <button onClick={()=>window.location.href='/playlists'}>Minhas Playlists</button>
        </div>
      </div>

      <h3 style={{marginTop:24,marginBottom:12}}>Músicas em Destaque</h3>
      <div className="library-grid">
        {sampleTracks.map(t=> (
          <div key={t.id} className="track-card card animate-fade">
            <div className="track-cover" style={{backgroundImage:`url(${t.image || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="%230b1220"/></svg>'})`}} />
            <div className="track-body">
              <div>
                <div className="title" style={{fontSize:14,fontWeight:600,marginBottom:4}}>{t.title}</div>
                <div className="artist" style={{fontSize:12,color:'var(--muted)',marginBottom:8}}>{t.artist}</div>
              </div>
              <div style={{display:'flex',gap:6,marginTop:8}}>
                <button onClick={()=>playTrack(t)} className="plan-cta" style={{flex:1}}>Tocar</button>
                <a href={`https://www.youtube.com/watch?v=${t.youtubeId}`} target="_blank" rel="noreferrer" style={{flex:1}}>
                  <button style={{width:'100%'}}>YouTube</button>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
