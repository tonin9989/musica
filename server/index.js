import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import multer from 'multer'
import fs from 'fs'
import { parseFile } from 'music-metadata'
import Jimp from 'jimp'
import sqlite3 from 'sqlite3'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const port = process.env.PORT || 3000

const mediaDir = path.join(process.cwd(),'media')
// ensure media directory exists
fs.mkdirSync(mediaDir, { recursive: true })
const dataDir = path.join(process.cwd(),'server','data')
fs.mkdirSync(dataDir, { recursive: true })
const playlistsFile = path.join(dataDir, 'playlists.json')
const usersFile = path.join(dataDir, 'users.json')
// ensure data files exist
if(!fs.existsSync(playlistsFile)) fs.writeFileSync(playlistsFile, '[]')
if(!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, '[]')
const chargesFile = path.join(dataDir, 'charges.json')
if(!fs.existsSync(chargesFile)) fs.writeFileSync(chargesFile, '[]')

const thumbsDir = path.join(mediaDir, 'thumbnails')
fs.mkdirSync(thumbsDir, { recursive: true })

// try to open sqlite DB; fallback to JSON files if sqlite not available
const dbPath = path.join(dataDir, 'db.sqlite')
let useDb = false
let db = null
try{
  sqlite3.verbose()
  db = new sqlite3.Database(dbPath)
  db.serialize(()=>{
    db.run('CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, email TEXT UNIQUE, pass TEXT)')
    db.run('CREATE TABLE IF NOT EXISTS playlists(id INTEGER PRIMARY KEY, name TEXT, tracks TEXT, owner INTEGER)')
  })
  useDb = true
}catch(err){
  console.warn('SQLite not available, using JSON files:', err && err.message)
  useDb = false
}

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret'
const PIX_KEY = process.env.PIX_KEY || 'CHAVE_PIX_PLACEHOLDER'

function readJson(file){
  try{ return JSON.parse(fs.readFileSync(file,'utf8')||'[]') }catch(e){ return [] }
}

function writeJson(file, data){
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
}

function readCharges(){
  try{ return JSON.parse(fs.readFileSync(chargesFile,'utf8')||'[]') }catch(e){ return [] }
}

function writeCharges(ch){
  writeJson(chargesFile, ch)
}

function generateChargeId(){
  return 'ch_' + Date.now() + Math.floor(Math.random()*9000+1000)
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, mediaDir)
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
})
const upload = multer({storage})

// Simple CORS headers so vite dev server or other origins can call API during development
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

app.use('/media', express.static(mediaDir))
app.use(express.static(path.join(process.cwd(),'dist')))

// Health check for hosting providers
app.get('/health', (req, res) => {
  res.json({ ok: true, uptime: process.uptime(), timestamp: Date.now() })
})

// API: list media files in the media folder with minimal metadata
app.get('/api/media', async (req, res) => {
  try {
    const files = await fs.promises.readdir(mediaDir)
    const items = await Promise.all(files.map(async (f) => {
      const filePath = path.join(mediaDir, f)
      try{
        const stat = await fs.promises.stat(filePath)
        // try to parse metadata (ID3) - may fail for non-audio files
        let title = f.replace(/[-_0-9]+/g, ' ').replace(/\.(mp3|wav|m4a|flac|ogg)$/i, '').trim()
        let artist = ''
        let cover = null
        let duration = null
        try{
          const mm = await parseFile(filePath, {native: false})
          const common = mm.common || {}
          title = common.title || title
          if(common.artist) artist = common.artist
          else if(common.artists && common.artists.length) artist = common.artists.join(', ')
          if(mm.format && mm.format.duration) duration = Math.round(mm.format.duration)
          if(common.picture && common.picture.length){
            const pic = common.picture[0]
            const mime = pic.format || 'image/jpeg'
            const b64 = Buffer.from(pic.data).toString('base64')
            cover = `data:${mime};base64,${b64}`
            // generate thumbnail file for faster loading (resize to 200px)
            try{
              const img = await Jimp.read(Buffer.from(pic.data))
              img.cover(200,200)
              const thumbBuf = await img.getBufferAsync(Jimp.MIME_JPEG)
              const thumbName = f + '.jpg'
              const thumbPath = path.join(thumbsDir, thumbName)
              await fs.promises.writeFile(thumbPath, thumbBuf)
              // expose as /media/thumbnails/<name>
              // also include thumbSrc for frontend
              return { name:f, title, artist, src: '/media/' + f, cover, thumb: '/media/thumbnails/' + thumbName, size: stat.size, duration, createdAt: stat.ctime }
            }catch(err){
              // if thumbnail generation fails, just return cover as data url
            }
          }
        }catch(err){
          // ignore metadata parse errors and fallback to filename-derived title
        }

        return {
          name: f,
          title,
          artist,
          src: '/media/' + f,
          cover,
          size: stat.size,
          duration,
          createdAt: stat.ctime
        }
      }catch(err){
        return null
      }
    }))
    res.json(items.filter(Boolean))
  }catch(err){
    res.status(500).json({ error: String(err) })
  }
})

// Simple auth endpoints
app.post('/api/register', express.json(), async (req, res) => {
  const { email, pass } = req.body || {}
  if(!email || !pass) return res.status(400).json({error:'email and pass required'})
  const users = readJson(usersFile)
  if(users.find(u=>u.email===email)) return res.status(400).json({error:'user exists'})
  const hash = await bcrypt.hash(pass, 10)
  const user = { id: Date.now(), email, pass: hash }
  users.push(user)
  writeJson(usersFile, users)
  const token = jwt.sign({id:user.id,email:user.email}, JWT_SECRET, {expiresIn:'7d'})
  res.json({user:{id:user.id,email:user.email}, token})
})

app.post('/api/login', express.json(), async (req,res)=>{
  const { email, pass } = req.body || {}
  if(!email || !pass) return res.status(400).json({error:'email and pass required'})
  const users = readJson(usersFile)
  const user = users.find(u=>u.email===email)
  if(!user) return res.status(401).json({error:'invalid credentials'})
  const ok = await bcrypt.compare(pass, user.pass)
  if(!ok) return res.status(401).json({error:'invalid credentials'})
  const token = jwt.sign({id:user.id,email:user.email}, JWT_SECRET, {expiresIn:'7d'})
  res.json({user:{id:user.id,email:user.email}, token})
})

function authMiddleware(req,res,next){
  const hdr = req.headers.authorization || ''
  if(!hdr.startsWith('Bearer ')) return res.status(401).json({error:'missing token'})
  const token = hdr.split(' ')[1]
  try{
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload
    next()
  }catch(err){
    return res.status(401).json({error:'invalid token'})
  }
}

// Playlists CRUD (DB or JSON fallback)
function getPlaylists(){
  if(useDb){
    return new Promise((resolve, reject)=>{
      db.all('SELECT id,name,tracks,owner FROM playlists', [], (err, rows)=>{
        if(err) return reject(err)
        const mapped = rows.map(r=>({ id: r.id, name: r.name, tracks: JSON.parse(r.tracks||'[]'), owner: r.owner }))
        resolve(mapped)
      })
    })
  }
  return Promise.resolve(readJson(playlistsFile))
}

function createPlaylist(name, tracks, owner){
  if(useDb){
    return new Promise((resolve, reject)=>{
      const t = JSON.stringify(tracks||[])
      db.run('INSERT INTO playlists(name,tracks,owner) VALUES(?,?,?)', [name,t,owner], function(err){
        if(err) return reject(err)
        resolve({ id: this.lastID, name, tracks: tracks||[], owner })
      })
    })
  }
  const pls = readJson(playlistsFile)
  const pl = { id: Date.now(), name, tracks: tracks||[], owner }
  pls.push(pl)
  writeJson(playlistsFile, pls)
  return Promise.resolve(pl)
}

function updatePlaylist(id, data, userId){
  if(useDb){
    return new Promise((resolve, reject)=>{
      db.get('SELECT owner FROM playlists WHERE id=?', [id], (err,row)=>{
        if(err) return reject(err)
        if(!row) return reject({ code:404 })
        if(row.owner !== userId) return reject({ code:403 })
        const name = data.name || row.name
        const tracks = JSON.stringify(data.tracks || [])
        db.run('UPDATE playlists SET name=?, tracks=? WHERE id=?', [name, tracks, id], function(err2){
          if(err2) return reject(err2)
          resolve({ id, name, tracks: JSON.parse(tracks), owner: userId })
        })
      })
    })
  }
  const pls = readJson(playlistsFile)
  const idx = pls.findIndex(p=>p.id===id)
  if(idx===-1) return Promise.reject({ code:404 })
  const pl = pls[idx]
  if(pl.owner !== userId) return Promise.reject({ code:403 })
  pls[idx] = { ...pl, ...(data||{}) }
  writeJson(playlistsFile, pls)
  return Promise.resolve(pls[idx])
}

function deletePlaylist(id, userId){
  if(useDb){
    return new Promise((resolve, reject)=>{
      db.get('SELECT owner FROM playlists WHERE id=?', [id], (err,row)=>{
        if(err) return reject(err)
        if(!row) return reject({ code:404 })
        if(row.owner !== userId) return reject({ code:403 })
        db.run('DELETE FROM playlists WHERE id=?', [id], function(err2){
          if(err2) return reject(err2)
          resolve(true)
        })
      })
    })
  }
  const pls = readJson(playlistsFile)
  const idx = pls.findIndex(p=>p.id===id)
  if(idx===-1) return Promise.reject({ code:404 })
  const pl = pls[idx]
  if(pl.owner !== userId) return Promise.reject({ code:403 })
  pls.splice(idx,1)
  writeJson(playlistsFile, pls)
  return Promise.resolve(true)
}

app.get('/api/playlists', async (req,res)=>{
  try{
    const pls = await getPlaylists()
    res.json(pls)
  }catch(err){
    res.status(500).json({error:String(err)})
  }
})

app.post('/api/playlists', express.json(), authMiddleware, async (req,res)=>{
  const { name, tracks } = req.body || {}
  if(!name) return res.status(400).json({error:'name required'})
  try{
    const pl = await createPlaylist(name, tracks||[], req.user.id)
    res.json(pl)
  }catch(err){
    res.status(500).json({error:String(err)})
  }
})

app.put('/api/playlists/:id', express.json(), authMiddleware, async (req,res)=>{
  const id = Number(req.params.id)
  try{
    const updated = await updatePlaylist(id, req.body||{}, req.user.id)
    res.json(updated)
  }catch(err){
    if(err && err.code===404) return res.status(404).json({error:'not found'})
    if(err && err.code===403) return res.status(403).json({error:'not owner'})
    res.status(500).json({error:String(err)})
  }
})

app.delete('/api/playlists/:id', authMiddleware, async (req,res)=>{
  const id = Number(req.params.id)
  try{
    await deletePlaylist(id, req.user.id)
    res.json({ok:true})
  }catch(err){
    if(err && err.code===404) return res.status(404).json({error:'not found'})
    if(err && err.code===403) return res.status(403).json({error:'not owner'})
    res.status(500).json({error:String(err)})
  }
})

// Subscribe to a plan (simple mock persistence in JSON users file)
app.post('/api/subscribe', express.json(), authMiddleware, async (req, res) => {
  const { plan } = req.body || {}
  if(!plan) return res.status(400).json({ error: 'plan required' })
  try{
    if(useDb){
      // SQLite persistence for user plans not implemented in this simple example.
      // For now, return success but do not persist in DB.
      return res.json({ ok: true, plan })
    }
    const users = readJson(usersFile)
    const idx = users.findIndex(u => u.id === req.user.id)
    if(idx === -1) return res.status(404).json({ error: 'user not found' })
    users[idx].plan = plan
    writeJson(usersFile, users)
    const safeUser = { id: users[idx].id, email: users[idx].email, plan: users[idx].plan }
    res.json({ ok: true, user: safeUser })
  }catch(err){
    res.status(500).json({ error: String(err) })
  }
})

// Create a PIX charge (simulated or via PSP adapter)
import { createPixCharge as interCreate, verifyWebhook as interVerify } from './lib/bancoInter.js'

app.post('/api/create-charge', express.json(), async (req, res) => {
  const token = (req.headers.authorization||'').replace('Bearer ','')
  // lightweight auth check (reuse existing jwt logic)
  try{
    if(!token) return res.status(401).json({ error: 'missing token' })
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload
  }catch(err){ return res.status(401).json({ error: 'invalid token' }) }

  const { plan, amount } = req.body || {}
  if(!plan) return res.status(400).json({ error: 'plan required' })
  const prices = { premium: 19.9, family: 29.9 }
  const value = typeof amount === 'number' ? amount : (prices[plan] || 0)

  // if provider is Banco Inter, delegate
  const provider = process.env.PSP_PROVIDER || ''
  let pixPayload = null
  let providerChargeId = null
  try{
    if(provider === 'banco_inter'){
      const created = await interCreate({ amount: value, reference: req.user.id, description: `Plan ${plan}` })
      providerChargeId = created.chargeId
      pixPayload = created.pixPayload
    } else {
      // fallback simulated payload
      pixPayload = `PIX|ch:${Date.now()}|key:${PIX_KEY}|amount:${value}`
    }
  }catch(err){
    return res.status(500).json({ error: String(err) })
  }

  const charges = readCharges()
  const charge = {
    id: generateChargeId(),
    providerChargeId: providerChargeId || null,
    provider: provider || 'simulated',
    userId: req.user.id,
    plan,
    amount: value,
    status: 'pending',
    createdAt: Date.now(),
    pixPayload
  }
  charges.push(charge)
  writeCharges(charges)
  res.json({ charge })
})

// Get charge status
app.get('/api/charges/:id', authMiddleware, (req, res) => {
  const id = req.params.id
  const charges = readCharges()
  const ch = charges.find(c=>c.id===id)
  if(!ch) return res.status(404).json({ error: 'not found' })
  if(ch.userId !== req.user.id) return res.status(403).json({ error: 'forbidden' })
  res.json({ charge: ch })
})

// Webhook endpoint for PSP to notify payment (secured by an optional secret header)
app.post('/api/webhook/pix', express.json(), (req, res) => {
  const provider = process.env.PSP_PROVIDER || ''
  // If provider is banco_inter, use its verification
  if(provider === 'banco_inter'){
    const v = interVerify(req.body, req.headers)
    if(!v.valid) return res.status(401).json({ error: 'invalid webhook' })
    const chargeId = v.chargeId
    const status = v.status
    if(!chargeId) return res.status(400).json({ error: 'chargeId required' })
    const charges = readCharges()
    const idx = charges.findIndex(c=>c.providerChargeId===chargeId || c.id===chargeId)
    if(idx===-1) return res.status(404).json({ error: 'not found' })
    charges[idx].status = status || 'paid'
    charges[idx].paidAt = Date.now()
    writeCharges(charges)
    try{
      const users = readJson(usersFile)
      const uidx = users.findIndex(u=>u.id===charges[idx].userId)
      if(uidx!==-1 && charges[idx].status === 'paid'){
        users[uidx].plan = charges[idx].plan
        writeJson(usersFile, users)
      }
    }catch(e){ }
    return res.json({ ok: true })
  }

  // fallback: use webhook secret header if set
  const secret = req.headers['x-webhook-secret'] || ''
  const expected = process.env.WEBHOOK_SECRET || ''
  if(expected && secret !== expected) return res.status(401).json({ error: 'invalid webhook secret' })
  const { chargeId, status } = req.body || {}
  if(!chargeId) return res.status(400).json({ error: 'chargeId required' })
  const charges = readCharges()
  const idx = charges.findIndex(c=>c.id===chargeId)
  if(idx===-1) return res.status(404).json({ error: 'not found' })
  charges[idx].status = status || 'paid'
  charges[idx].paidAt = Date.now()
  writeCharges(charges)
  try{
    const users = readJson(usersFile)
    const uidx = users.findIndex(u=>u.id===charges[idx].userId)
    if(uidx!==-1 && charges[idx].status === 'paid'){
      users[uidx].plan = charges[idx].plan
      writeJson(usersFile, users)
    }
  }catch(e){ }
  res.json({ ok: true })
})

// Simulate a payment (for local testing) - marks a charge as paid and triggers internal webhook behaviour
app.post('/api/simulate-pay', express.json(), authMiddleware, (req, res) => {
  const { chargeId } = req.body || {}
  if(!chargeId) return res.status(400).json({ error: 'chargeId required' })
  const charges = readCharges()
  const idx = charges.findIndex(c=>c.id===chargeId && c.userId===req.user.id)
  if(idx===-1) return res.status(404).json({ error: 'not found' })
  charges[idx].status = 'paid'
  charges[idx].paidAt = Date.now()
  writeCharges(charges)
  // update user plan
  try{
    const users = readJson(usersFile)
    const uidx = users.findIndex(u=>u.id===req.user.id)
    if(uidx!==-1){ users[uidx].plan = charges[idx].plan; writeJson(usersFile, users) }
  }catch(e){ }
  res.json({ ok: true, charge: charges[idx] })
})

app.post('/upload', upload.array('files'), (req,res)=>{
  const results = []
  Promise.all(req.files.map(async (f)=>{
    const rel = '/media/' + path.basename(f.path)
    // try to extract metadata and generate thumbnail
    try{
      const mm = await parseFile(f.path, {native:false})
      const common = mm.common || {}
      if(common.picture && common.picture.length){
        try{
          const pic = common.picture[0]
          const img = await Jimp.read(Buffer.from(pic.data))
          img.cover(200,200)
          const thumbName = path.basename(f.path) + '.jpg'
          const thumbPath = path.join(thumbsDir, thumbName)
          const thumbBuf = await img.getBufferAsync(Jimp.MIME_JPEG)
          await fs.promises.writeFile(thumbPath, thumbBuf)
        }catch(e){ /* ignore */ }
      }
    }catch(e){ /* ignore metadata errors */ }
    results.push(rel)
  })).then(()=>{
    res.json({ message: 'Arquivos enviados', files: results })
  }).catch(err=>{
    res.status(500).json({ error: String(err) })
  })
})

app.get('*', (req,res)=>{
  res.sendFile(path.join(process.cwd(),'dist','index.html'))
})

app.listen(port, ()=>console.log('Server listening on',port))
