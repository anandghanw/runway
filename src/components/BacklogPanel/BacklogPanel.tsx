import { useDroppable } from '@dnd-kit/core'
import { Task } from '../../types'
import { TaskCard } from '../TodoSection/TaskCard'
import './BacklogPanel.css'

interface Props {
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onTaskContextMenu: (task: Task, x: number, y: number) => void
  onAddTask: () => void
}

export function BacklogPanel({ tasks, onTaskClick, onTaskContextMenu, onAddTask }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: 'backlog' })

  const sorted = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    return a.order - b.order
  })

  return (
    <div className={`backlog-panel${isOver ? ' drop-over' : ''}`} ref={setNodeRef}>
      <div className="backlog-label">Waiting</div>
      <div className="backlog-tasks">
        {sorted.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            columnWidth={160}
            onClick={onTaskClick}
            onContextMenu={onTaskContextMenu}
          />
        ))}
        {sorted.length === 0 && (
          <div className="backlog-empty">Drop tasks here</div>
        )}
      </div>
      <button className="backlog-add-btn" onClick={onAddTask} title="Add waiting task">+</button>
    </div>
  )
}
