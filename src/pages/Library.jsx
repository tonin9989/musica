import React, {useEffect, useState} from 'react'

// Biblioteca lê uma lista simples em localStorage chamada `mediaList`.
export default function Library(){
  const [list, setList] = useState([])
  const [playlists, setPlaylists] = useState([])

  useEffect(()=>{
    const raw = localStorage.getItem('mediaList')
    if(raw) setList(JSON.parse(raw))
    const pls = localStorage.getItem('playlists')
    if(pls) setPlaylists(JSON.parse(pls))
  },[])

  function play(item, playlist = null){
    if(playlist){
      localStorage.setItem('activePlaylist', JSON.stringify({name:playlist.name, tracks: playlist.tracks, index: playlist.tracks.findIndex(t=>t.src===item.src)}))
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
    const pls = JSON.parse(localStorage.getItem('playlists')||'[]')
    const idx = pls.findIndex(p=>p.name===name)
    if(idx===-1){
      alert('Playlist não encontrada')
      return
    }
    pls[idx].tracks.push(item)
    localStorage.setItem('playlists', JSON.stringify(pls))
    alert('Adicionado à playlist')
  }

  return (
    <div className="page library">
      <h2>Biblioteca</h2>
      <p>Adicione arquivos na pasta <code>/media</code> e depois coloque seus metadados em localStorage chamando a chave <code>mediaList</code>.</p>
      <ul className="track-list">
        {list.map((t,i)=> (
          <li key={i}>
            <img src={t.image} alt="cover" />
            <div className="meta">
              <div className="title">{t.title}</div>
              <div className="artist">{t.artist}</div>
            </div>
            <div className="actions">
              <button onClick={()=>play(t)}>Play</button>
              <button onClick={()=>addToPlaylist(t)}>Add à playlist</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
