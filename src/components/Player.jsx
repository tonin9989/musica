import React, {useState, useRef, useEffect} from 'react'
import { FaBackward, FaPlay, FaPause, FaForward, FaVolumeUp } from 'react-icons/fa'

export default function Player(){
  const [track, setTrack] = useState(null)
  const audioRef = useRef(new Audio())
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(0.9)

  // load current track from storage and listen for changes
  useEffect(()=>{
    function onTrackChange(){
      const saved = localStorage.getItem('currentTrack')
      if(saved){
        const t = JSON.parse(saved)
        setTrack(t)
      }
    }

    onTrackChange()
    window.addEventListener('trackChanged', onTrackChange)
    return ()=> window.removeEventListener('trackChanged', onTrackChange)
  },[])

  // when track changes, update audio src
  useEffect(()=>{
    if(!track) return
    audioRef.current.src = track.src
    audioRef.current.currentTime = 0
    audioRef.current.volume = volume
    if(playing) audioRef.current.play().catch(()=>{})
  },[track])

  // play/pause behaviour
  useEffect(()=>{
    if(playing) audioRef.current.play().catch(()=>{})
    else audioRef.current.pause()
  },[playing])

  // progress updates
  useEffect(()=>{
    function timeUpdate(){
      setProgress((audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100)
    }
    audioRef.current.addEventListener('timeupdate', timeUpdate)
    return ()=> audioRef.current.removeEventListener('timeupdate', timeUpdate)
  },[])

  // handle end -> next in activePlaylist
  useEffect(()=>{
    function onEnded(){
      const active = JSON.parse(localStorage.getItem('activePlaylist')||'null')
      if(active){
        const nextIndex = (active.index || 0) + 1
        if(nextIndex < active.tracks.length){
          active.index = nextIndex
          localStorage.setItem('activePlaylist', JSON.stringify(active))
          const next = active.tracks[nextIndex]
          localStorage.setItem('currentTrack', JSON.stringify(next))
          setTrack(next)
          setPlaying(true)
        } else {
          setPlaying(false)
        }
      } else {
        setPlaying(false)
      }
    }

    audioRef.current.addEventListener('ended', onEnded)
    return ()=> audioRef.current.removeEventListener('ended', onEnded)
  },[])

  function toggle(){
    if(!track) return
    setPlaying(p=>!p)
  }

  function seek(e){
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = x / rect.width
    if(audioRef.current.duration) audioRef.current.currentTime = pct * audioRef.current.duration
  }

  function onVolumeChange(e){
    const v = parseFloat(e.target.value)
    setVolume(v)
    audioRef.current.volume = v
  }

  return (
    <div className="player">
      <div className="player-info" style={{display:'flex',gap:12,alignItems:'center'}}>
        {track && (track.cover || track.image) ? (
          <img src={track.cover || track.image} alt="cover" style={{width:56,height:56,objectFit:'cover',borderRadius:8}} />
        ) : null}
        <div>
          <div className="track-title">{track ? track.title : 'Nenhuma faixa'}</div>
          <div className="track-artist">{track && track.artist ? track.artist : ''}</div>
        </div>
        <div className="progress" onClick={seek} style={{width:'100%', height:8, background:'#072022', borderRadius:8, marginTop:8, cursor:'pointer'}}>
          <div style={{width:`${progress}%`,height:'100%',background:'var(--accent)',borderRadius:8}} />
        </div>
      </div>
      <div className="player-controls">
        <button onClick={() => {
          // try to play previous
          const active = JSON.parse(localStorage.getItem('activePlaylist')||'null')
          if(active){
            const idx = (active.index || 0) - 1
            if(idx >= 0){
              active.index = idx
              localStorage.setItem('activePlaylist', JSON.stringify(active))
              const prev = active.tracks[idx]
              localStorage.setItem('currentTrack', JSON.stringify(prev))
              setTrack(prev)
              setPlaying(true)
            }
          }
        }} aria-label="Anterior"><FaBackward /></button>
        <button onClick={toggle} style={{minWidth:90}} className="play-btn" aria-label={playing? 'Pausar' : 'Tocar'}>{playing ? <FaPause /> : <FaPlay />}</button>
        <button onClick={() => {
          const active = JSON.parse(localStorage.getItem('activePlaylist')||'null')
          if(active){
            const nextIndex = (active.index || 0) + 1
            if(nextIndex < active.tracks.length){
              active.index = nextIndex
              localStorage.setItem('activePlaylist', JSON.stringify(active))
              const next = active.tracks[nextIndex]
              localStorage.setItem('currentTrack', JSON.stringify(next))
              setTrack(next)
              setPlaying(true)
            }
          }
        }} aria-label="Próxima"><FaForward /></button>
        <div style={{display:'flex',alignItems:'center',gap:8,marginLeft:12}}>
          <FaVolumeUp style={{color:'var(--muted)'}} />
          <input type="range" min="0" max="1" step="0.01" value={volume} onChange={onVolumeChange} />
        </div>
      </div>
    </div>
  )
}
