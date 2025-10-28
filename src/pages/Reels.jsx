import React from 'react'

const reels = [
  { id: 'r1', title: 'Samba Vibes', youtubeId: 'hcm55lU9knw' },
  { id: 'r2', title: 'Anitta - Vai Malandra', youtubeId: 'rDtsUlBya8o' },
  { id: 'r3', title: 'Street Percussion', youtubeId: 'kJQP7kiw5Fk' },
  { id: 'r4', title: 'Acoustic Moment', youtubeId: 'JGwWNGJdvx8' },
  { id: 'r5', title: 'Classical Snippet', youtubeId: 'fOk8Tm815lE' },
  { id: 'r6', title: 'Latin Groove', youtubeId: 'cU6td2kRj3I' }
]

function playReel(r){
  const t = { title: r.title, artist: 'Reel', youtubeId: r.youtubeId }
  localStorage.setItem('activePlaylist', JSON.stringify({ index: 0, tracks: [t] }))
  localStorage.setItem('currentTrack', JSON.stringify(t))
  window.dispatchEvent(new Event('trackChanged'))
}

export default function Reels(){
  return (
    <div className="page reels">
      <h2>Reels</h2>
      <p className="muted">Curadoria de vídeos curtos e clipes prontos para tocar no player embutido.</p>

      <div className="reels-grid">
        {reels.map(r=> (
          <div key={r.id} className="reel-card card">
            <div className="reel-thumb" style={{backgroundImage:`url(https://img.youtube.com/vi/${r.youtubeId}/hqdefault.jpg)`}} />
            <div style={{paddingTop:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontWeight:700}}>{r.title}</div>
                <div className="muted" style={{fontSize:13}}>YouTube Clip</div>
              </div>
              <div>
                <button onClick={()=>playReel(r)} className="plan-cta">Play</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
