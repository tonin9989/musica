import React, {useState, useEffect, useRef} from 'react'

export default function Playlists(){
  const [playlists, setPlaylists] = useState([])
  const [name, setName] = useState('')
  const [editing, setEditing] = useState(null) // index
  const [availableTracks, setAvailableTracks] = useState([])
  const [showAddModal, setShowAddModal] = useState(null) // playlist index
  const dropRef = useRef()

  async function load(){
    try{
      const token = localStorage.getItem('token')
      const res = await fetch('/api/playlists', { headers: token ? { Authorization: 'Bearer '+token } : {} })
      if(res.ok){
        const data = await res.json()
        setPlaylists(data)
      }
    }catch(err){ console.error(err) }
  }

  async function loadAvailableTracks(){
    try{
      const res = await fetch('/api/media')
      if(res.ok){
        const data = await res.json()
        setAvailableTracks(data)
      }
    }catch(err){ 
      // fallback to localStorage
      const raw = localStorage.getItem('mediaList')
      if(raw) setAvailableTracks(JSON.parse(raw))
    }
  }

  useEffect(()=>{ 
    load()
    loadAvailableTracks()
  },[])

  async function create(){
    if(!name) return
    const token = localStorage.getItem('token')
    try{
      const res = await fetch('/api/playlists', { method:'POST', headers: {'Content-Type':'application/json', Authorization: token? 'Bearer '+token : ''}, body: JSON.stringify({ name, tracks: [] }) })
      if(res.ok){ setName(''); await load() }
      else { const b = await res.json(); alert(b.error||'Erro') }
    }catch(err){ alert(err) }
  }

  async function remove(id){
    if(!confirm('Remover playlist?')) return
    try{
      const token = localStorage.getItem('token')
      const res = await fetch('/api/playlists/'+id, { method:'DELETE', headers: { Authorization: token? 'Bearer '+token : '' } })
      if(res.ok) load()
      else { const b=await res.json(); alert(b.error||'Erro') }
    }catch(err){ console.error(err) }
  }

  function playPlaylist(p){
    if(!p.tracks || !p.tracks.length) return alert('Playlist vazia')
    localStorage.setItem('activePlaylist', JSON.stringify({name:p.name, tracks:p.tracks, index:0}))
    localStorage.setItem('currentTrack', JSON.stringify(p.tracks[0]))
    window.dispatchEvent(new Event('trackChanged'))
  }

  function openEdit(i){ setEditing(i) }

  function moveTrackLocal(plIndex, idx, dir){
    const pls = [...playlists]
    const arr = pls[plIndex].tracks || []
    const to = dir==='up' ? idx-1 : idx+1
    if(to<0 || to>=arr.length) return
    const tmp = arr[to]
    arr[to] = arr[idx]
    arr[idx] = tmp
    pls[plIndex].tracks = arr
    setPlaylists(pls)
  }

  function removeTrackFromPlaylist(plIndex, trackIndex){
    const pls = [...playlists]
    pls[plIndex].tracks.splice(trackIndex, 1)
    setPlaylists(pls)
  }

  function addTrackToPlaylist(plIndex, track){
    const pls = [...playlists]
    if(!pls[plIndex].tracks) pls[plIndex].tracks = []
    // check if already in playlist
    const exists = pls[plIndex].tracks.find(t => t.src === track.src || t.youtubeId === track.youtubeId)
    if(exists) return alert('Esta música já está na playlist')
    pls[plIndex].tracks.push(track)
    setPlaylists(pls)
    setShowAddModal(null)
  }

  async function savePlaylist(pl){
    try{
      const token = localStorage.getItem('token')
      const res = await fetch('/api/playlists/'+pl.id, { method:'PUT', headers: {'Content-Type':'application/json', Authorization: token? 'Bearer '+token : ''}, body: JSON.stringify(pl) })
      if(res.ok) {
        await load()
        setEditing(null)
      }
      else { const b=await res.json(); alert(b.error||'Erro') }
    }catch(err){ console.error(err) }
  }

  async function handleFiles(files){
    const fd = new FormData()
    for(const f of files) fd.append('files', f)
    const res = await fetch('/upload', {method:'POST', body:fd})
    const json = await res.json()
    alert(json.message || 'Upload completo')
    await load()
    await loadAvailableTracks()
  }

  useEffect(()=>{
    const el = dropRef.current
    function prevent(e){ e.preventDefault(); e.stopPropagation() }
    function onDrop(e){ prevent(e); const files = Array.from(e.dataTransfer.files); handleFiles(files) }
    if(el){
      el.addEventListener('dragenter', prevent)
      el.addEventListener('dragover', prevent)
      el.addEventListener('drop', onDrop)
    }
    return ()=>{
      if(el){
        el.removeEventListener('dragenter', prevent)
        el.removeEventListener('dragover', prevent)
        el.removeEventListener('drop', onDrop)
      }
    }
  },[])

  return (
    <div className="page playlists">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
        <div>
          <h2>Playlists</h2>
          <p className="muted">Crie, edite e reproduza suas playlists.</p>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <input placeholder="Nome da playlist" value={name} onChange={e=>setName(e.target.value)} />
          <button onClick={create}>Criar</button>
        </div>
      </div>

      <div className="playlists-grid" style={{marginTop:12}}>
        {playlists.length===0 && <div className="card">Nenhuma playlist</div>}
        {playlists.map((p,i)=> (
          <div key={p.id} className="playlist-card card animate-fade">
            <div className="playlist-header">
              <div className="playlist-thumb" style={{backgroundImage:`url(${(p.tracks && p.tracks[0] && (p.tracks[0].image||p.tracks[0].cover)) || 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22><rect width=%22100%25%22 height=%22100%25%22 fill=%22%230b1220%22/></svg>'})`}} />
              <div style={{flex:1,marginLeft:12}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
                  <strong style={{fontSize:16}}>{p.name}</strong>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    <button onClick={()=>playPlaylist(p)} className="plan-cta">Tocar</button>
                    <button onClick={()=>setShowAddModal(i)}>+ Música</button>
                    <button onClick={()=>openEdit(i)}>Editar</button>
                    <button onClick={()=>remove(p.id)}>Remover</button>
                  </div>
                </div>
                <div className="muted" style={{marginTop:6}}>{(p.tracks && p.tracks.length) ? `${p.tracks.length} faixas` : 'Sem faixas'}</div>
              </div>
            </div>

            {p.tracks && p.tracks.length>0 && (
              <div className="playlist-tracks">
                {p.tracks.map((t,ti)=> (
                  <div key={ti} className="track-row">
                    <div style={{display:'flex',alignItems:'center',gap:8,flex:1,minWidth:0}}>
                      <img src={t.image||t.cover||'/media/default.png'} alt="c" style={{width:48,height:48,objectFit:'cover',borderRadius:6}} />
                      <div style={{flex:1,minWidth:0,overflow:'hidden'}}>
                        <div style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t.title}</div>
                        <div style={{fontSize:12,color:'var(--muted)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t.artist}</div>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:4,flexShrink:0}}>
                      <button onClick={()=>removeTrackFromPlaylist(i, ti)} title="Remover">×</button>
                      <button onClick={()=>moveTrackLocal(i, ti, 'up')} title="Mover para cima">↑</button>
                      <button onClick={()=>moveTrackLocal(i, ti, 'down')} title="Mover para baixo">↓</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {editing===i && (
              <div style={{marginTop:8}}>
                <button onClick={()=>savePlaylist(playlists[i])} className="plan-cta">Salvar alterações</button>
                <button onClick={()=>setEditing(null)} style={{marginLeft:8}}>Cancelar</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {showAddModal !== null && (
        <div className="qr-modal-backdrop" onClick={()=>setShowAddModal(null)}>
          <div className="qr-modal" onClick={(e)=>e.stopPropagation()} style={{maxWidth:'600px',maxHeight:'80vh',overflow:'auto'}}>
            <h3>Adicionar música à playlist: {playlists[showAddModal]?.name}</h3>
            <div style={{marginTop:12}}>
              {availableTracks.length === 0 && <p className="muted">Nenhuma música disponível</p>}
              {availableTracks.map((track, idx) => (
                <div key={idx} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:8,borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,flex:1,minWidth:0}}>
                    <img src={track.cover||track.image||'/media/default.png'} alt="" style={{width:40,height:40,objectFit:'cover',borderRadius:4}} />
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{track.title}</div>
                      <div style={{fontSize:12,color:'var(--muted)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{track.artist}</div>
                    </div>
                  </div>
                  <button onClick={()=>addTrackToPlaylist(showAddModal, track)} className="plan-cta" style={{flexShrink:0}}>Adicionar</button>
                </div>
              ))}
            </div>
            <div style={{marginTop:12,textAlign:'center'}}>
              <button onClick={()=>setShowAddModal(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      <h3 style={{marginTop:16}}>Upload de arquivos (arraste para cá)</h3>
      <div ref={dropRef} className="dropzone" style={{border:'2px dashed rgba(255,255,255,0.06)',padding:20,borderRadius:8}}>Arraste arquivos aqui para enviar ao servidor</div>
      <p>Ou use o botão abaixo</p>
      <form id="uploadForm">
        <input type="file" name="files" multiple />
        <button type="button" onClick={async ()=>{
          const form = document.getElementById('uploadForm')
          const fd = new FormData(form)
          const res = await fetch('/upload', {method:'POST', body:fd})
          const json = await res.json()
          alert(json.message || 'Upload completo')
          await load()
          await loadAvailableTracks()
        }}>Enviar</button>
      </form>
    </div>
  )
}
