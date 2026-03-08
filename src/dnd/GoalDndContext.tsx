import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core'
import { addDays, format } from 'date-fns'
import { Phase } from '../types'
import { YEAR, ROW_HEIGHT } from '../constants'
import { dayIndexOf } from '../utils/dates'

interface Props {
  children: React.ReactNode
  columnWidth: number
  phases: Phase[]
  onUpdatePhase: (phase: Phase) => void
  year?: number
}

function addDaysToStr(dateStr: string, days: number): string {
  return format(addDays(new Date(dateStr), days), 'yyyy-MM-dd')
}

function clampDate(dateStr: string, minStr: string, maxStr: string): string {
  if (dateStr < minStr) return minStr
  if (dateStr > maxStr) return maxStr
  return dateStr
}

export function PhaseDndContext({ children, columnWidth, onUpdatePhase, year = YEAR }: Omit<Props, 'phases'> & { phases?: Phase[] }) {
  const yearStartStr = format(new Date(year, 0, 1), 'yyyy-MM-dd')
  const [draggingPhase, setDraggingPhase] = useState<Phase | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  function handleDragStart(event: DragStartEvent) {
    const phase = event.active.data.current?.phase as Phase | undefined
    if (phase) setDraggingPhase(phase)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, delta } = event
    const phase = active.data.current?.phase as Phase | undefined
    setDraggingPhase(null)
    if (!phase) return

    const daysDelta = Math.round(delta.x / columnWidth)
    const yearEnd = format(addDays(new Date(year, 11, 31), 0), 'yyyy-MM-dd')

    const newStart = clampDate(addDaysToStr(phase.startDate, daysDelta), yearStartStr, yearEnd)
    const newEnd = clampDate(addDaysToStr(phase.endDate, daysDelta), yearStartStr, yearEnd)

    const finalStart = newStart <= newEnd ? newStart : newEnd
    const finalEnd = newStart <= newEnd ? newEnd : newStart

    onUpdatePhase({ ...phase, startDate: finalStart, endDate: finalEnd })
  }

  function handleDragCancel() {
    setDraggingPhase(null)
  }

  const previewWidth = draggingPhase
    ? (dayIndexOf(draggingPhase.endDate, year) - dayIndexOf(draggingPhase.startDate, year) + 1) * columnWidth
    : 0

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}
      <DragOverlay dropAnimation={null}>
        {draggingPhase && (
          <div
            style={{
              width: Math.max(previewWidth, 4),
              height: ROW_HEIGHT - 4,
              background: draggingPhase.color,
              borderRadius: 4,
              opacity: 0.85,
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 500,
              color: '#fff',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            {draggingPhase.title}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
