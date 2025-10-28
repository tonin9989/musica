import React, {useState, useRef, useEffect} from 'react'
import { FaBackward, FaPlay, FaPause, FaForward, FaVolumeUp } from 'react-icons/fa'

export default function Player(){
  const [track, setTrack] = useState(null)
  const audioRef = useRef(new Audio())
  const ytContainerRef = useRef(null)
  const ytPlayerRef = useRef(null)
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

  // when track changes, update audio src or youtube player
  useEffect(()=>{
    if(!track) return
    // cleanup previous yt player if switching from one
    if(track.youtubeId){
      // pause audio
      audioRef.current.pause()
      // ensure YT API is loaded and create player
      loadYouTubeAPI().then(()=>{
        createYouTubePlayer(track.youtubeId, playing)
      }).catch(()=>{
        // fallback: open youtube in new tab
      })
      return
    }
    // non-youtube: destroy any existing yt player and use native audio
    destroyYouTubePlayer()
    audioRef.current.src = track.src
    audioRef.current.currentTime = 0
    audioRef.current.volume = volume
    if(playing) audioRef.current.play().catch(()=>{})
  },[track])

  // play/pause behaviour
  useEffect(()=>{
    if(!track) return
    if(track.youtubeId){
      // if we have a YT player, control it
      const p = ytPlayerRef.current
      if(p && p.playVideo && p.pauseVideo){
        if(playing) p.playVideo()
        else p.pauseVideo()
      }
      // ensure native audio is paused
      audioRef.current.pause()
      return
    }
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
    // also wire YT ended event via a wrapper (YT uses Player events)
    function ytEndedHandler(){ onEnded() }
    // We'll rely on createYouTubePlayer to attach YT ended callbacks
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
    // If YT player exists, set volume there too (0-100)
    const p = ytPlayerRef.current
    try{ if(p && p.setVolume) p.setVolume(Math.round(v * 100)) }catch(e){}
  }

  // --- YouTube API helpers ---
  function loadYouTubeAPI(){
    return new Promise((resolve, reject)=>{
      if(window.YT && window.YT.Player) return resolve()
      // if script already added and loading, wait for ready
      const existing = document.getElementById('youtube-iframe-api')
      if(existing){
        const onYouTubeIframeAPIReady = () => { resolve() }
        // attach temporary global handler fallback
        const prev = window.onYouTubeIframeAPIReady
        window.onYouTubeIframeAPIReady = function(){ if(prev) prev(); onYouTubeIframeAPIReady() }
        setTimeout(()=>resolve(), 2000) // fallback
        return
      }
      const tag = document.createElement('script')
      tag.id = 'youtube-iframe-api'
      tag.src = 'https://www.youtube.com/iframe_api'
      tag.onload = ()=>{
        // wait for global ready
      }
      document.body.appendChild(tag)
      // global callback called by YT script
      const handler = () => { resolve(); window.onYouTubeIframeAPIReady = null }
      window.onYouTubeIframeAPIReady = handler
      // safety timeout
      setTimeout(()=>resolve(), 3000)
    })
  }

  function createYouTubePlayer(videoId, autoplay){
    destroyYouTubePlayer()
    if(!ytContainerRef.current) return
    try{
      ytPlayerRef.current = new window.YT.Player(ytContainerRef.current, {
        height: '180',
        width: '320',
        videoId: videoId,
        playerVars: { rel: 0, controls: 1, autoplay: autoplay ? 1 : 0 },
        events: {
          onStateChange: function(e){
            // YT ended = 0
            if(e.data === window.YT.PlayerState.ENDED){
              // trigger same logic as audio ended
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
          }
        }
      })
      // set initial volume
      try{ if(ytPlayerRef.current.setVolume) ytPlayerRef.current.setVolume(Math.round(volume*100)) }catch(e){}
    }catch(err){
      console.warn('YT player create failed', err)
      ytPlayerRef.current = null
    }
  }

  function destroyYouTubePlayer(){
    try{
      if(ytPlayerRef.current && ytPlayerRef.current.destroy) ytPlayerRef.current.destroy()
    }catch(e){}
    ytPlayerRef.current = null
    // clear container
    if(ytContainerRef.current) ytContainerRef.current.innerHTML = ''
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
        {!track || track.youtubeId ? null : (
          <div className="progress" onClick={seek} style={{width:'100%', height:8, background:'#072022', borderRadius:8, marginTop:8, cursor:'pointer'}}>
            <div style={{width:`${progress}%`,height:'100%',background:'var(--accent)',borderRadius:8}} />
          </div>
        )}
      </div>
      {/* YouTube iframe (shown when a youtubeId is present) */}
      {track && track.youtubeId ? (
        <div style={{flex:1,display:'flex',justifyContent:'center',alignItems:'center',padding:'8px 12px'}}>
          <iframe title="youtube-player" src={youtubeSrc} width="320" height="180" frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen style={{borderRadius:8}} />
        </div>
      ) : null}
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
