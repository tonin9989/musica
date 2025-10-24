import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import multer from 'multer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const port = process.env.PORT || 3000

const mediaDir = path.join(process.cwd(),'media')
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, mediaDir)
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
})
const upload = multer({storage})

app.use('/media', express.static(mediaDir))
app.use(express.static(path.join(process.cwd(),'dist')))

app.post('/upload', upload.array('files'), (req,res)=>{
  res.json({ message: 'Arquivos enviados', files: req.files.map(f=>('/media/'+path.basename(f.path))) })
})

app.get('*', (req,res)=>{
  res.sendFile(path.join(process.cwd(),'dist','index.html'))
})

app.listen(port, ()=>console.log('Server listening on',port))
