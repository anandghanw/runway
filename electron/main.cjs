const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')

const isDev = !app.isPackaged

const RUNWAY_DIR = path.join(os.homedir(), 'Documents', 'runway')
const BACKUP_FILE = path.join(RUNWAY_DIR, 'runway-backup.txt')
const BACKUP_DIR = path.join(RUNWAY_DIR, 'daily backups')

function todayStamp() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function writeDailyBackup(content) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
  const dailyFile = path.join(BACKUP_DIR, `runway-backup-${todayStamp()}.txt`)
  fs.writeFileSync(dailyFile, content, 'utf-8')

  // Prune files older than 30 days
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
  for (const name of fs.readdirSync(BACKUP_DIR)) {
    const full = path.join(BACKUP_DIR, name)
    try {
      if (fs.statSync(full).mtimeMs < cutoff) fs.unlinkSync(full)
    } catch { /* ignore */ }
  }
}

ipcMain.handle('backup-write', (_, content) => {
  try {
    fs.mkdirSync(RUNWAY_DIR, { recursive: true })
    fs.writeFileSync(BACKUP_FILE, content, 'utf-8')
    writeDailyBackup(content)
    return 'ok'
  } catch {
    return 'error'
  }
})

ipcMain.handle('backup-read', () => {
  try {
    return fs.readFileSync(BACKUP_FILE, 'utf-8')
  } catch {
    return null
  }
})

function createWindow() {
  const isMac = process.platform === 'darwin'
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    titleBarStyle: isMac ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
