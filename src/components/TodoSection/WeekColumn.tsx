import { useDroppable } from '@dnd-kit/core'
import { format } from 'date-fns'
import { Task } from '../../types'
import { TaskCard } from './TaskCard'
import { todayStr } from '../../utils/dates'
import './WeekColumn.css'

interface Props {
  dates: string[]
  tasks: Task[]
  totalWidth: number
  label: string
  isCurrent: boolean
  isAltMonth: boolean
  headerTop?: number
  onHeaderClick?: (firstDate: string) => void
  onTaskClick: (task: Task) => void
  onTaskContextMenu: (task: Task, x: number, y: number) => void
  onAddTask: (date: string) => void
}

const today = todayStr()

export function WeekColumn({ dates, tasks, totalWidth, label, isCurrent, isAltMonth, headerTop = 0, onHeaderClick, onTaskClick, onTaskContextMenu, onAddTask }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: dates[0] })

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    if (a.date !== b.date) return a.date < b.date ? -1 : 1
    return a.order - b.order
  })

  function handleAddTask() {
    const target = dates.find(d => d >= today) ?? dates[dates.length - 1]
    onAddTask(target)
  }

  return (
    <div
      className={`week-column${isCurrent ? ' current-week' : ''}${isOver ? ' drop-over' : ''}${isAltMonth ? ' alt-month' : ''}`}
      style={{ width: totalWidth, minWidth: totalWidth }}
    >
      <div
        className={`week-col-header${isCurrent ? ' current-week-header' : ''}${onHeaderClick ? ' clickable' : ''}`}
        style={{ top: headerTop }}
        onClick={onHeaderClick ? () => onHeaderClick(dates[0]) : undefined}
      >
        {label}
      </div>
      <div ref={setNodeRef} className="week-col-tasks" onDoubleClick={handleAddTask}>
          {sortedTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              columnWidth={totalWidth}
              dayLabel={format(new Date(task.date + 'T00:00:00'), 'EEE d')}
              onClick={onTaskClick}
              onContextMenu={onTaskContextMenu}
            />
          ))}
        <div className="week-add-hint" onClick={e => { e.stopPropagation(); handleAddTask() }}>+</div>
      </div>
    </div>
  )
}
