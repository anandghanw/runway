import { useCallback } from 'react'
import { AppState } from '../types'
import { parseBackup } from '../utils/backup'

const ENDPOINT = '/api/backup'
const isElectron = typeof window !== 'undefined' && 'electronAPI' in window

export function useBackupFile() {
  const write = useCallback(async (content: string) => {
    if (isElectron) {
      await (window as any).electronAPI.writeBackup(content)
    } else {
      try {
        await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: content,
        })
      } catch { /* dev server not running — ignore */ }
    }
  }, [])

  const importFile = useCallback((): Promise<AppState | null> => {
    return new Promise(resolve => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.txt'
      input.onchange = async () => {
        const file = input.files?.[0]
        if (!file) return resolve(null)
        resolve(parseBackup(await file.text()))
      }
      input.click()
    })
  }, [])

  return { write, importFile }
}
