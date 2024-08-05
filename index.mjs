import express from 'express'
import { join } from 'path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = join(__filename, '..')

const app = express()

app.get('/undefined.html', (req, res) => {
  res.redirect(301, '/')
})
app.get('/', (req, res) => {
  res.sendFile('undefined.html', { root: join(__dirname, 'site') })
})
app.use(express.static('site'))
app.use('*', (req, res) => {
  res.status(404).sendFile('404.html', { root: join(__dirname, 'site') })
})
const PORT = process.env.PORT || 8080
app.listen(PORT)
