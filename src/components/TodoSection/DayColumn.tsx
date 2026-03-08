import { useDroppable } from '@dnd-kit/core'
import { Task } from '../../types'
import { TaskCard } from './TaskCard'
import { formatDateHeader } from '../../utils/dates'
import './DayColumn.css'

interface Props {
  date: string
  tasks: Task[]
  columnWidth: number
  isToday: boolean
  isAltMonth: boolean
  isAltWeek: boolean
  onTaskClick: (task: Task) => void
  onTaskContextMenu: (task: Task, x: number, y: number) => void
  onAddTask: (date: string) => void
}

export function DayColumn({ date, tasks, columnWidth, isToday, isAltMonth, isAltWeek, onTaskClick, onTaskContextMenu, onAddTask }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: date })

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    return a.order - b.order
  })

  return (
    <div
      className={`day-column${isToday ? ' today' : ''}${isOver ? ' drop-over' : ''}${isAltMonth ? ' alt-month' : ''}${isAltWeek ? ' alt-week' : ''}`}
      style={{ width: columnWidth, minWidth: columnWidth }}
    >
      {columnWidth >= 100 && (
        <div className={`day-header${isToday ? ' today-header' : ''}`}>
          {formatDateHeader(date, columnWidth)}
        </div>
      )}
      <div
        ref={setNodeRef}
        className="day-tasks"
        onDoubleClick={() => onAddTask(date)}
      >
          {sortedTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              columnWidth={columnWidth}
              onClick={onTaskClick}
              onContextMenu={onTaskContextMenu}
            />
          ))}
        {columnWidth >= 40 && (
          <div className="day-add-hint" onClick={e => { e.stopPropagation(); onAddTask(date) }}>+</div>
        )}
      </div>
    </div>
  )
}
