import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import os from 'os'

const RUNWAY_DIR = path.join(os.homedir(), 'Documents', 'runway')
const BACKUP_FILE = path.join(RUNWAY_DIR, 'runway-backup.txt')
const BACKUP_DIR = path.join(RUNWAY_DIR, 'daily backups')

// Returns today's date as YYYY-MM-DD in local time
function todayStamp(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// Write a daily snapshot only once per day; prune files older than 30 days
function writeDailyBackup(content: string) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
  const dailyFile = path.join(BACKUP_DIR, `runway-backup-${todayStamp()}.txt`)
  fs.writeFileSync(dailyFile, content, 'utf-8')

  // Prune backups older than 30 days
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
  for (const name of fs.readdirSync(BACKUP_DIR)) {
    const full = path.join(BACKUP_DIR, name)
    if (fs.statSync(full).mtimeMs < cutoff) fs.unlinkSync(full)
  }
}

const isGHPages = process.env.DEPLOY_TARGET === 'ghpages'

export default defineConfig({
  base: isGHPages ? '/runway/' : './',
  plugins: [
    react(),
    {
      name: 'runway-backup',
      configureServer(server) {
        server.middlewares.use('/api/backup', (req, res) => {
          res.setHeader('Access-Control-Allow-Origin', '*')

          if (req.method === 'POST') {
            let body = ''
            req.on('data', chunk => { body += chunk })
            req.on('end', () => {
              try {
                fs.mkdirSync(RUNWAY_DIR, { recursive: true })
                fs.writeFileSync(BACKUP_FILE, body, 'utf-8')
                writeDailyBackup(body)
                res.writeHead(200).end('ok')
              } catch {
                res.writeHead(500).end('error')
              }
            })

          } else if (req.method === 'GET') {
            try {
              const content = fs.readFileSync(BACKUP_FILE, 'utf-8')
              res.writeHead(200, { 'Content-Type': 'text/plain' }).end(content)
            } catch {
              res.writeHead(404).end('')
            }

          } else {
            res.writeHead(405).end()
          }
        })
      },
    },
  ],
})
