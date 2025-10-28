import React, {useState, useEffect, useRef} from 'react'

export default function Playlists(){
  const [playlists, setPlaylists] = useState([])
  const [name, setName] = useState('')
  const [editing, setEditing] = useState(null) // index
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

  useEffect(()=>{ load() },[])

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

  async function savePlaylist(pl){
    try{
      const token = localStorage.getItem('token')
      const res = await fetch('/api/playlists/'+pl.id, { method:'PUT', headers: {'Content-Type':'application/json', Authorization: token? 'Bearer '+token : ''}, body: JSON.stringify(pl) })
      if(res.ok) load()
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
      <h2>Playlists</h2>
      <div>
        <input placeholder="Nome da playlist" value={name} onChange={e=>setName(e.target.value)} />
        <button onClick={create}>Criar</button>
      </div>

      <div className="playlists-grid" style={{marginTop:12}}>
        {playlists.length===0 && <p>Nenhuma playlist</p>}
        {playlists.map((p,i)=> (
          <div key={p.id} className="playlist-item card" style={{marginBottom:12}}>
            <div style={{flex:1}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <strong>{p.name}</strong>
                <div>
                  <button onClick={()=>playPlaylist(p)} style={{marginRight:8}}>Tocar</button>
                  <button onClick={()=>openEdit(i)} style={{marginRight:8}}>Editar</button>
                  <button onClick={()=>remove(p.id)}>Remover</button>
                </div>
              </div>
              <div style={{marginTop:8}}>
                {(!p.tracks || p.tracks.length===0) && <div className="muted">Sem faixas</div>}
                {p.tracks && p.tracks.map((t,ti)=> (
                  <div key={ti} className="track-row" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <img src={t.image||t.cover||'/media/default.png'} alt="c" style={{width:40,height:40,objectFit:'cover',borderRadius:6}} />
                      <div>
                        <div>{t.title}</div>
                        <div style={{fontSize:12,color:'var(--muted)'}}>{t.artist}</div>
                      </div>
                    </div>
                    <div>
                      <button onClick={()=>{ const pls=[...playlists]; pls[i].tracks.splice(ti,1); setPlaylists(pls);}}>Remover</button>
                      <button onClick={()=>moveTrackLocal(i, ti, 'up')}>↑</button>
                      <button onClick={()=>moveTrackLocal(i, ti, 'down')}>↓</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {editing===i && (
              <div style={{marginTop:8}}>
                <button onClick={()=>savePlaylist(playlists[i])}>Salvar alterações</button>
              </div>
            )}
          </div>
        ))}
      </div>

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
        }}>Enviar</button>
      </form>
    </div>
  )
}
