import React, {useEffect, useState, useRef} from 'react'
import { apiFetch } from '../lib/api'

// Biblioteca: lê da API /api/media quando disponível e permite upload via /upload
export default function Library(){
  const [list, setList] = useState([])
  const [playlists, setPlaylists] = useState([])
  const inputRef = useRef()


  async function fetchMedia(){
    try{
      const res = await apiFetch('/api/media')
      if(res.ok){
        const data = await res.json()
        // map to expected shape
        const mapped = data.map(d=>({title:d.title, artist:d.artist||'', src:d.src, image:d.cover||'', duration:d.duration||null}))
        setList(mapped)
        localStorage.setItem('mediaList', JSON.stringify(mapped))
        return
      }
    }catch(err){
      // fallback to localStorage
    }
    const raw = localStorage.getItem('mediaList')
    if(raw) setList(JSON.parse(raw))
  }

  useEffect(()=>{
    fetchMedia()
    // fetch server playlists when available
    async function loadPls(){
      try{
        const token = localStorage.getItem('token')
        const res = await apiFetch('/api/playlists', { headers: token ? { Authorization: 'Bearer '+token } : {} })
        if(res.ok){
          const p = await res.json()
          setPlaylists(p)
          return
        }
      }catch(err){}
      const pls = localStorage.getItem('playlists')
      if(pls) setPlaylists(JSON.parse(pls))
    }
    loadPls()
  },[])

  function play(item, playlist = null){
    if(playlist){
      const idx = playlist.tracks.findIndex(t=>t.src === item.src)
      localStorage.setItem('activePlaylist', JSON.stringify({name:playlist.name, tracks: playlist.tracks, index: idx>=0?idx:0}))
      localStorage.setItem('currentTrack', JSON.stringify(item))
    } else {
      localStorage.setItem('currentTrack', JSON.stringify(item))
      localStorage.removeItem('activePlaylist')
    }
    window.dispatchEvent(new Event('trackChanged'))
  }

  async function addToPlaylist(item){
    const pls = playlists
    if(!pls || pls.length === 0){
      alert('Você não tem playlists. Crie uma primeiro!')
      return
    }
    
    // Show selection modal
    const names = pls.map((p,i) => `${i+1}. ${p.name}`).join('\n')
    const choice = prompt(`Escolha uma playlist (digite o número):\n${names}`)
    if(!choice) return
    
    const idx = parseInt(choice) - 1
    if(idx < 0 || idx >= pls.length){
      alert('Playlist inválida')
      return
    }

    const token = localStorage.getItem('token')
    try{
      const pl = pls[idx]
      pl.tracks = pl.tracks || []
      
      // Check if already exists
      const exists = pl.tracks.find(t => (t.src && t.src === item.src) || (t.youtubeId && t.youtubeId === item.youtubeId))
      if(exists){
        alert('Esta música já está na playlist!')
        return
      }
      
      pl.tracks.push(item)
      const upd = await fetch('/api/playlists/'+pl.id, { method:'PUT', headers: {'Content-Type':'application/json', Authorization: 'Bearer '+token}, body: JSON.stringify(pl) })
      if(upd.ok){ 
        alert(`Adicionado à playlist "${pl.name}"!`)
        await fetchPlaylists()
        return
      }
      alert('Erro ao atualizar playlist')
    }catch(err){ 
      alert('Erro: ' + err)
    }
  }

  async function fetchPlaylists(){
    try{
      const token = localStorage.getItem('token')
      const res = await fetch('/api/playlists', { headers: token ? { Authorization: 'Bearer '+token } : {} })
      if(res.ok){
        const p = await res.json()
        setPlaylists(p)
      }
    }catch(err){}
  }

  async function uploadFiles(files){
    if(!files || files.length===0) return
    const fd = new FormData()
    for(const f of files) fd.append('files', f)
    try{
      const res = await apiFetch('/upload', {method:'POST', body: fd})
      if(res.ok){
        const body = await res.json()
        alert(body.message || 'Upload completo')
        // refresh list
        await fetchMedia()
      } else {
        alert('Erro no upload')
      }
    }catch(err){
      alert('Erro: ' + err)
    }
  }

  function onFileChange(e){
    const f = e.target.files
    if(f && f.length) uploadFiles(f)
  }

  return (
    <div className="page library">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <h2>Biblioteca</h2>
          <p className="muted">Faça upload de músicas ou gerencie sua coleção. Clique em Play para ouvir aqui.</p>
        </div>
        <div style={{display:'flex',gap:10}}>
          <input style={{display:'none'}} ref={inputRef} onChange={onFileChange} type="file" multiple accept="audio/*" id="libFiles" />
          <label htmlFor="libFiles"><button>Selecionar arquivos</button></label>
          <button onClick={()=> fetchMedia()}>Atualizar</button>
        </div>
      </div>

      <div className="library-grid" style={{marginTop:16}}>
        {list.length===0 && <div className="card">Nenhuma música encontrada</div>}
        {list.map((t,i)=> (
          <div key={i} className="track-card card animate-fade">
            <div className="track-cover" style={{backgroundImage:`url(${t.image||'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="%230b1220"/></svg>'})`}} />
            <div className="track-body">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div className="title">{t.title}</div>
                  <div className="artist">{t.artist}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div className="muted">{t.duration? `${Math.floor(t.duration/60)}:${('0'+(t.duration%60)).slice(-2)}` : ''}</div>
                  <div style={{marginTop:8}}>
                    <button onClick={()=>play(t)} className="plan-cta">Play</button>
                    <button onClick={()=>addToPlaylist(t)} style={{marginLeft:8}}>Add</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
