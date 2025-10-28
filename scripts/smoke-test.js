async function run(){
  try{
    const media = await fetch('http://localhost:3000/api/media')
    console.log('/api/media', media.status)
    const pls = await fetch('http://localhost:3000/api/playlists')
    console.log('/api/playlists', pls.status)
    console.log('smoke test done')
  }catch(err){
    console.error('smoke failed', err)
    process.exit(1)
  }
}
run()
