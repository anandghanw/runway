import { AppState } from '../../types'
import { useBackupFile } from '../../hooks/useBackupFile'
import { formatBackup } from '../../utils/backup'
import './BackupPanel.css'

interface Props {
  state: AppState
  onImport: (state: AppState) => void
}

export function BackupPanel({ state, onImport }: Props) {
  const { importFile } = useBackupFile()

  async function handleImport() {
    const loaded = await importFile()
    if (loaded) onImport(loaded)
    else alert('Could not parse backup file.')
  }

  function handleExport() {
    const content = formatBackup(state)
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'runway-backup.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="backup-panel">
      <span className="backup-label">Backup</span>
      <button className="import-btn" onClick={handleImport} title="Import from backup file">
        Import
      </button>
      <button className="import-btn" onClick={handleExport} title="Download backup file">
        Export
      </button>
    </div>
  )
}
