import { useState } from 'react'
import { format, addWeeks, subWeeks } from 'date-fns'
import { Task } from '../../types'
import { exportWeek, getWeekStart } from '../../utils/export'
import './ExportPanel.css'

interface Props {
  tasks: Task[]
}

export function ExportPanel({ tasks }: Props) {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))

  return (
    <div className="export-panel">
      <button className="export-nav" onClick={() => setWeekStart(w => subWeeks(w, 1))}>‹</button>
      <span className="export-week-label">
        Week of {format(weekStart, 'MMM d')}
      </span>
      <button className="export-nav" onClick={() => setWeekStart(w => addWeeks(w, 1))}>›</button>
      <button className="export-btn" onClick={() => exportWeek(tasks, weekStart)}>
        Export
      </button>
    </div>
  )
}
