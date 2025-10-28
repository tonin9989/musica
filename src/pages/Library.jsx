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
    const name = prompt('Escolha a playlist (nome exato):')
    if(!name) return
    // try server playlists first
    const token = localStorage.getItem('token')
    try{
      const res = await fetch('/api/playlists', { headers: token ? { Authorization: 'Bearer '+token } : {} })
      if(res.ok){
        const pls = await res.json()
        const idx = pls.findIndex(p=>p.name===name)
        if(idx===-1){
          if(!token){ alert('Playlist não encontrada localmente e você não está autenticado'); return }
          // create a new playlist on server
          const create = await fetch('/api/playlists', { method:'POST', headers: {'Content-Type':'application/json', Authorization: 'Bearer '+token}, body: JSON.stringify({ name, tracks: [item] }) })
          if(create.ok){ alert('Playlist criada e faixa adicionada'); fetchPlaylists(); return }
          alert('Erro criando playlist')
          return
        }
        // add to existing server playlist
        const pl = pls[idx]
        pl.tracks = pl.tracks || []
        pl.tracks.push(item)
        const upd = await fetch('/api/playlists/'+pl.id, { method:'PUT', headers: {'Content-Type':'application/json', Authorization: 'Bearer '+token}, body: JSON.stringify(pl) })
        if(upd.ok){ alert('Adicionado à playlist') ; fetchPlaylists(); return }
        alert('Erro ao atualizar playlist')
        return
      }
    }catch(err){ }

    // fallback localStorage playlists
    const pls = JSON.parse(localStorage.getItem('playlists')||'[]')
    const idx = pls.findIndex(p=>p.name===name)
    if(idx===-1){
      alert('Playlist não encontrada (sem conexão)')
      return
    }
    pls[idx].tracks.push(item)
    localStorage.setItem('playlists', JSON.stringify(pls))
    alert('Adicionado à playlist (local)')
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
      <h2>Biblioteca</h2>
      <p>Faça upload de músicas aqui ou coloque arquivos na pasta <code>/media</code>.</p>

      <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:12}}>
        <input ref={inputRef} onChange={onFileChange} type="file" multiple accept="audio/*" />
        <button onClick={()=> inputRef.current && inputRef.current.click()}>Selecionar arquivos</button>
        <button onClick={()=> fetchMedia()}>Atualizar lista</button>
      </div>

      <ul className="track-list">
        {list.map((t,i)=> (
          <li key={i}>
            <img src={t.image || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="100%" height="100%" fill="%230b1220"/><text x="50%" y="50%" fill="%23fff" font-size="10" dominant-baseline="middle" text-anchor="middle">MUSIC</text></svg>'} alt="cover" />
            <div className="meta">
              <div className="title">{t.title}</div>
              <div className="artist">{t.artist} {t.duration ? `• ${Math.floor(t.duration/60)}:${('0'+(t.duration%60)).slice(-2)}` : ''}</div>
            </div>
            <div className="actions row-actions">
              <button onClick={()=>play(t)}>Play</button>
              <button onClick={()=>addToPlaylist(t)}>Add à playlist</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
