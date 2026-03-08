import { ReactNode, useState, useRef } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  pointerWithin,
  rectIntersection,
  closestCenter,
  type CollisionDetection,
} from '@dnd-kit/core'
import { Task } from '../types'
import { TaskCardGhost } from '../components/TodoSection/TaskCard'

interface Props {
  children: ReactNode
  tasks: Task[]
  onMoveTask: (id: string, date: string, order: number) => void
  onReorderTasks: (date: string, ids: string[]) => void
}

const collisionDetection: CollisionDetection = (args) => {
  const pointer = pointerWithin(args)
  if (pointer.length > 0) return pointer
  const rect = rectIntersection(args)
  if (rect.length > 0) return rect
  return closestCenter(args)
}

function visualSort(a: Task, b: Task) {
  if (a.completed !== b.completed) return a.completed ? 1 : -1
  return a.order - b.order
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function TaskDndContext({ children, tasks, onMoveTask, onReorderTasks }: Props) {
  const draggedTaskRef = useRef<Task | null>(null)
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id)
    const task = tasks.find(t => t.id === id)
      ?? (event.active.data.current?.task as Task | undefined)
    if (task) {
      draggedTaskRef.current = task
      setActiveTask(task)
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { over } = event
    const draggedTask = draggedTaskRef.current
    draggedTaskRef.current = null
    setActiveTask(null)

    if (!over || !draggedTask) return

    const overId = String(over.id)
    const isDateTarget = DATE_RE.test(overId)

    if (isDateTarget) {
      // Dropped on a column (empty area)
      const targetTasks = tasks
        .filter(t => t.date === overId && t.id !== draggedTask.id)
        .sort(visualSort)
      const newOrder = targetTasks.filter(t => !t.completed).length
      onMoveTask(draggedTask.id, overId, newOrder)
    } else {
      // Dropped on a task card
      const overTask = tasks.find(t => t.id === overId)
      if (!overTask) return

      if (draggedTask.date === overTask.date) {
        // Same column — reorder
        const colTasks = tasks.filter(t => t.date === draggedTask.date).sort(visualSort)
        const oldIndex = colTasks.findIndex(t => t.id === draggedTask.id)
        const newIndex = colTasks.findIndex(t => t.id === overId)
        if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return
        const reordered = [...colTasks]
        reordered.splice(newIndex, 0, reordered.splice(oldIndex, 1)[0])
        onReorderTasks(draggedTask.date, reordered.map(t => t.id))
      } else {
        // Different column — move to that column at the task's position
        const targetTasks = tasks
          .filter(t => t.date === overTask.date && t.id !== draggedTask.id)
          .sort(visualSort)
        const insertAt = targetTasks.findIndex(t => t.id === overTask.id)
        onMoveTask(draggedTask.id, overTask.date, insertAt >= 0 ? insertAt : targetTasks.length)
      }
    }
  }

  function handleDragCancel() {
    draggedTaskRef.current = null
    setActiveTask(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}
      <DragOverlay dropAnimation={null}>
        {activeTask ? <TaskCardGhost task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
