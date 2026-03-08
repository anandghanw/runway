import { format, startOfWeek, addDays } from 'date-fns'
import { Task } from '../types'

export function exportWeek(tasks: Task[], weekStart: Date): void {
  const weekEnd = addDays(weekStart, 6)
  const startStr = format(weekStart, 'yyyy-MM-dd')
  const endStr = format(weekEnd, 'yyyy-MM-dd')

  const weekTasks = tasks
    .filter(t => t.completed && t.date >= startStr && t.date <= endStr)
    .sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order)

  const byDate: Record<string, Task[]> = {}
  for (const task of weekTasks) {
    if (!byDate[task.date]) byDate[task.date] = []
    byDate[task.date].push(task)
  }

  const lines: string[] = [
    `Week of ${format(weekStart, 'MMMM d, yyyy')} — ${format(weekEnd, 'MMMM d, yyyy')}`,
    '='.repeat(50),
    '',
  ]

  for (const [date, dayTasks] of Object.entries(byDate)) {
    lines.push(format(new Date(date + 'T00:00:00'), 'EEEE, MMMM d'))
    for (const task of dayTasks) {
      lines.push(`  [DONE] ${task.title}`)
      if (task.description) {
        lines.push(`         ${task.description}`)
      }
    }
    lines.push('')
  }

  if (weekTasks.length === 0) {
    lines.push('No completed tasks this week.')
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `week-${startStr}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

export function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 })
}
