import React, {useState, useEffect, useRef} from 'react'

export default function Playlists(){
  const [playlists, setPlaylists] = useState([])
  const [name, setName] = useState('')
  const [editing, setEditing] = useState(null) // index
  const dropRef = useRef()

  useEffect(()=>{
    const raw = localStorage.getItem('playlists')
    if(raw) setPlaylists(JSON.parse(raw))
  },[])

  function persist(pls){
    setPlaylists(pls)
    localStorage.setItem('playlists', JSON.stringify(pls))
  }

  function create(){
    if(!name) return
    const p = [...playlists, {name, tracks:[]}]
    persist(p)
    setName('')
  }

  function playPlaylist(p){
    if(!p.tracks.length) return alert('Playlist vazia')
    localStorage.setItem('activePlaylist', JSON.stringify({name:p.name, tracks:p.tracks, index:0}))
    localStorage.setItem('currentTrack', JSON.stringify(p.tracks[0]))
    window.dispatchEvent(new Event('trackChanged'))
  }

  function openEdit(i){
    setEditing(i)
  }

  function removePlaylist(i){
    if(!confirm('Excluir playlist?')) return
    const pls = [...playlists]
    pls.splice(i,1)
    persist(pls)
    setEditing(null)
  }

  function renamePlaylist(i){
    const newName = prompt('Novo nome', playlists[i].name)
    if(!newName) return
    const pls = [...playlists]
    pls[i].name = newName
    persist(pls)
  }

  function removeTrack(plIndex, tIndex){
    const pls = [...playlists]
    pls[plIndex].tracks.splice(tIndex,1)
    persist(pls)
  }

  function moveTrack(plIndex, tIndex, dir){
    const pls = [...playlists]
    const arr = pls[plIndex].tracks
    const newIndex = tIndex + dir
    if(newIndex < 0 || newIndex >= arr.length) return
    const item = arr.splice(tIndex,1)[0]
    arr.splice(newIndex,0,item)
    persist(pls)
  }

  async function handleFiles(files){
    const fd = new FormData()
    for(const f of files) fd.append('files', f)
    const res = await fetch('/upload', {method:'POST', body:fd})
    const json = await res.json()
    alert(json.message || 'Upload completo')
  }

  useEffect(()=>{
    const el = dropRef.current
    function prevent(e){ e.preventDefault(); e.stopPropagation() }
    function onDrop(e){ prevent(e); const files = Array.from(e.dataTransfer.files); handleFiles(files) }
    el.addEventListener('dragenter', prevent)
    el.addEventListener('dragover', prevent)
    el.addEventListener('drop', onDrop)
    return ()=>{
      el.removeEventListener('dragenter', prevent)
      el.removeEventListener('dragover', prevent)
      el.removeEventListener('drop', onDrop)
    }
  },[])

  return (
    <div className="page playlists">
      <h2>Playlists</h2>
      <div>
        <input placeholder="Nome da playlist" value={name} onChange={e=>setName(e.target.value)} />
        <button onClick={create}>Criar</button>
      </div>

      <div className="playlists-grid">
        <ul>
          {playlists.map((p,i)=> (
            <li key={i} className="playlist-item">
              <div>
                <strong>{p.name}</strong> ({p.tracks.length} faixas)
              </div>
              <div className="playlist-actions">
                <button onClick={()=>playPlaylist(p)}>Tocar</button>
                <button onClick={()=>openEdit(i)}>Editar</button>
                <button onClick={()=>renamePlaylist(i)}>Renomear</button>
                <button onClick={()=>removePlaylist(i)}>Excluir</button>
              </div>
            </li>
          ))}
        </ul>

        <div className="editor">
          {editing===null ? <div>Selecione uma playlist para editar</div> : (
            <div>
              <h3>Editando: {playlists[editing].name}</h3>
              <ul>
                {playlists[editing].tracks.map((t,ti)=> (
                  <li key={ti} className="track-row">
                    <img src={t.image} alt="capa" />
                    <div className="meta">
                      <div className="title">{t.title}</div>
                      <div className="artist">{t.artist}</div>
                    </div>
                    <div className="row-actions">
                      <button onClick={()=>moveTrack(editing,ti,-1)}>↑</button>
                      <button onClick={()=>moveTrack(editing,ti,1)}>↓</button>
                      <button onClick={()=>removeTrack(editing,ti)}>Remover</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <h3>Upload de arquivos (arraste para cá)</h3>
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
        }}>Enviar</button>
      </form>
    </div>
  )
}
