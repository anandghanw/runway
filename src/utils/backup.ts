import { AppState, Task, Phase } from '../types'

// ---------------------------------------------------------------------------
// Format
// ---------------------------------------------------------------------------

function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n')
}

function unescapeText(s: string): string {
  return s.replace(/\\n/g, '\n').replace(/\\\\/g, '\\')
}

export function formatBackup(state: AppState): string {
  const lines: string[] = []
  const now = new Date().toISOString()

  lines.push('# Runway Backup')
  lines.push('# Version: 1')
  lines.push(`# Saved: ${now}`)
  lines.push('#')
  lines.push('# To restore: open Runway and click "Import backup".')
  lines.push('')
  lines.push('--- PHASES ---')
  lines.push('')

  for (const p of state.phases) {
    lines.push('[PHASE]')
    lines.push(`id: ${p.id}`)
    lines.push(`title: ${escapeText(p.title)}`)
    lines.push(`start: ${p.startDate}`)
    lines.push(`end: ${p.endDate}`)
    lines.push(`color: ${p.color}`)
    lines.push('')
  }

  lines.push('--- TASKS ---')
  lines.push('')

  const sorted = [...state.tasks].sort((a, b) =>
    a.date !== b.date ? a.date.localeCompare(b.date) : a.order - b.order
  )

  for (const t of sorted) {
    lines.push('[TASK]')
    lines.push(`id: ${t.id}`)
    lines.push(`title: ${escapeText(t.title)}`)
    lines.push(`date: ${t.date}`)
    lines.push(`completed: ${t.completed}`)
    lines.push(`order: ${t.order}`)
    lines.push(`description: ${escapeText(t.description)}`)
    lines.push('')
  }

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Parse
// ---------------------------------------------------------------------------

function parseBlock(lines: string[]): Record<string, string> {
  const obj: Record<string, string> = {}
  for (const line of lines) {
    const idx = line.indexOf(': ')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    const value = line.slice(idx + 2)
    obj[key] = value
  }
  return obj
}

export function parseBackup(text: string): AppState | null {
  try {
    const phases: Phase[] = []
    const tasks: Task[] = []

    // Split into blocks by [PHASE] / [TASK] markers
    const blockRegex = /^\[(PHASE|TASK)\]$/m
    const parts = text.split(blockRegex)

    // parts: [preamble, type1, block1, type2, block2, ...]
    for (let i = 1; i < parts.length; i += 2) {
      const type = parts[i]
      const blockLines = parts[i + 1]?.split('\n').filter(l => l.trim() && !l.startsWith('#')) ?? []
      const obj = parseBlock(blockLines)

      if (type === 'PHASE') {
        if (!obj.id || !obj.title || !obj.start || !obj.end || !obj.color) continue
        phases.push({
          id: obj.id,
          title: unescapeText(obj.title),
          startDate: obj.start,
          endDate: obj.end,
          color: obj.color,
          row: 0, // will be re-packed on load
        })
      } else if (type === 'TASK') {
        if (!obj.id || !obj.title || !obj.date) continue
        tasks.push({
          id: obj.id,
          title: unescapeText(obj.title),
          date: obj.date,
          completed: obj.completed === 'true',
          order: parseInt(obj.order ?? '0') || 0,
          description: unescapeText(obj.description ?? ''),
        })
      }
    }

    return { tasks, phases }
  } catch {
    return null
  }
}
