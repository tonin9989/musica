import React, {useState, useRef, useEffect} from 'react'

export default function Player(){
  const [track, setTrack] = useState(null)
  const audioRef = useRef(new Audio())
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(()=>{
    function onTrackChange(){
      const saved = localStorage.getItem('currentTrack')
      if(saved){
        const t = JSON.parse(saved)
        setTrack(t)
        audioRef.current.src = t.src
        setPlaying(true)
      }
    }

    onTrackChange()
    window.addEventListener('trackChanged', onTrackChange)
    return ()=> window.removeEventListener('trackChanged', onTrackChange)
  },[])

  useEffect(()=>{
    if(playing) audioRef.current.play()
    else audioRef.current.pause()

    function timeUpdate(){
      setProgress((audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100)
    }

    audioRef.current.addEventListener('timeupdate', timeUpdate)
    return ()=> audioRef.current.removeEventListener('timeupdate', timeUpdate)
  },[playing])

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
          audioRef.current.src = next.src
          audioRef.current.play()
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

  return (
    <div className="player">
      <div className="player-info">
        <div className="track-title">{track ? track.title : 'Nenhuma faixa'}</div>
        <div className="track-artist">{track ? track.artist : ''}</div>
        <div className="progress" style={{width:200, height:6, background:'#072022', borderRadius:6, marginTop:8}}>
          <div style={{width:`${progress}%`,height:'100%',background:'var(--accent)',borderRadius:6}} />
        </div>
      </div>
      <div className="player-controls">
        <button onClick={toggle}>{playing ? 'Pause' : 'Play'}</button>
      </div>
    </div>
  )
}
