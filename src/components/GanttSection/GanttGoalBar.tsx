import { useState, useRef, useEffect, useCallback } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { addDays, format } from 'date-fns'
import { Phase } from '../../types'
import { ROW_HEIGHT } from '../../constants'
import './GanttGoalBar.css'

interface Props {
  phase: Phase
  left: number
  width: number
  columnWidth: number
  onClick: (phase: Phase) => void
  onUpdate: (phase: Phase) => void
}

const LABEL_INTERVAL = 400

function tileOffsets(width: number, interval: number): number[] {
  const offsets: number[] = []
  for (let x = interval / 2; x < width; x += interval) {
    offsets.push(x)
  }
  return offsets.length > 0 ? offsets : [width / 2]
}

function addDaysToStr(dateStr: string, days: number): string {
  return format(addDays(new Date(dateStr), days), 'yyyy-MM-dd')
}

export function GanttPhaseBar({ phase, left, width, columnWidth, onClick, onUpdate }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: phase.id,
    data: { phase },
  })

  const [resizeDays, setResizeDays] = useState(0)
  const [resizeSide, setResizeSide] = useState<'left' | 'right' | null>(null)
  const resizeDaysRef = useRef(0)
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null)
  const barRef = useRef<HTMLDivElement | null>(null)

  const setRef = useCallback((node: HTMLDivElement | null) => {
    barRef.current = node
    setNodeRef(node)
  }, [setNodeRef])

  useEffect(() => {
    const el = barRef.current
    if (!el) return
    const onDown = (e: PointerEvent) => { pointerDownPos.current = { x: e.clientX, y: e.clientY } }
    el.addEventListener('pointerdown', onDown)
    return () => el.removeEventListener('pointerdown', onDown)
  }, [])

  const top = phase.row * ROW_HEIGHT
  const barWidth = Math.max(width, 4)

  // Live preview while resizing
  let displayLeft = left
  let displayWidth = barWidth
  if (resizeSide === 'right') {
    displayWidth = Math.max(columnWidth, barWidth + resizeDays * columnWidth)
  } else if (resizeSide === 'left') {
    displayLeft = left + resizeDays * columnWidth
    displayWidth = Math.max(columnWidth, barWidth - resizeDays * columnWidth)
  }

  function startResize(e: React.PointerEvent, side: 'left' | 'right') {
    e.preventDefault()
    e.stopPropagation()
    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)
    const startX = e.clientX
    resizeDaysRef.current = 0
    setResizeSide(side)
    setResizeDays(0)

    function onMove(ev: PointerEvent) {
      const deltaX = ev.clientX - startX
      const snapped = Math.round(deltaX / columnWidth / 7) * 7
      resizeDaysRef.current = snapped
      setResizeDays(snapped)
    }

    function onUp() {
      target.releasePointerCapture(e.pointerId)
      const delta = resizeDaysRef.current
      if (delta !== 0) {
        if (side === 'right') {
          const newEnd = addDaysToStr(phase.endDate, delta)
          if (newEnd > phase.startDate) onUpdate({ ...phase, endDate: newEnd })
        } else {
          const newStart = addDaysToStr(phase.startDate, delta)
          if (newStart < phase.endDate) onUpdate({ ...phase, startDate: newStart })
        }
      }
      setResizeSide(null)
      setResizeDays(0)
      resizeDaysRef.current = 0
      target.removeEventListener('pointermove', onMove)
      target.removeEventListener('pointerup', onUp)
    }

    target.addEventListener('pointermove', onMove)
    target.addEventListener('pointerup', onUp)
  }

  return (
    <div
      ref={setRef}
      className={`gantt-bar${isDragging ? ' dragging' : ''}${resizeSide ? ' resizing' : ''}`}
      style={{ left: displayLeft, width: displayWidth, top, height: ROW_HEIGHT - 4, background: phase.color }}
      onClick={e => {
        e.stopPropagation()
        const pos = pointerDownPos.current
        if (pos && (Math.abs(e.clientX - pos.x) > 4 || Math.abs(e.clientY - pos.y) > 4)) return
        if (!resizeSide) onClick(phase)
      }}
      {...attributes}
      {...listeners}
    >
      <div className="gantt-bar-handle left" onPointerDown={e => startResize(e, 'left')} />
      {tileOffsets(displayWidth, LABEL_INTERVAL).map((offset, i) => (
        <span key={i} className="gantt-bar-title" style={{ left: offset }}>
          {phase.title}
        </span>
      ))}
      <div className="gantt-bar-handle right" onPointerDown={e => startResize(e, 'right')} />
    </div>
  )
}
