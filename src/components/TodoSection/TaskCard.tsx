import { useDraggable } from '@dnd-kit/core'
import { Task } from '../../types'
import './TaskCard.css'

interface Props {
  task: Task
  columnWidth: number
  dayLabel?: string
  onClick: (task: Task) => void
  onContextMenu: (task: Task, x: number, y: number) => void
}

export function TaskCard({ task, columnWidth, dayLabel, onClick, onContextMenu }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useDraggable({ id: task.id, data: { task } })

  const style = {
    opacity: isDragging ? 0.3 : 1,
  }

  const showTitle = columnWidth >= 40

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-card${task.completed ? ' completed' : ''}${isDragging ? ' dragging' : ''}`}
      onClick={() => onClick(task)}
      onContextMenu={e => { e.preventDefault(); onContextMenu(task, e.clientX, e.clientY) }}
      {...attributes}
      {...listeners}
    >
      {showTitle ? (
        <>
          {dayLabel && <span className="task-day-label">{dayLabel}</span>}
          <span className="task-title">{task.title}</span>
        </>
      ) : (
        <span className="task-dot" />
      )}
    </div>
  )
}

export function TaskCardGhost({ task }: { task: Task }) {
  return (
    <div className="task-card ghost">
      <span className="task-title">{task.title}</span>
    </div>
  )
}
