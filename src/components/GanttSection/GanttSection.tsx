import { Phase } from '../../types'
import { GanttPhaseBar } from './GanttGoalBar'
import { dayIndexOf, isFirstOfMonth, getMonthLabel } from '../../utils/dates'
import { ROW_HEIGHT, YEAR } from '../../constants'
import './GanttSection.css'

interface Props {
  days: string[]
  phases: Phase[]
  columnWidth: number
  totalDays: number
  year?: number
  onPhaseClick: (phase: Phase) => void
  onUpdatePhase: (phase: Phase) => void
  onAddPhase: () => void
}

interface MonthSpan {
  label: string
  width: number
  left: number
  isAltMonth: boolean
}

function buildMonthSpans(days: string[], columnWidth: number): MonthSpan[] {
  const spans: MonthSpan[] = []
  let spanStart = 0
  let spanLabel = getMonthLabel(days[0])
  for (let i = 1; i < days.length; i++) {
    if (isFirstOfMonth(days[i])) {
      const month = parseInt(days[spanStart].slice(5, 7))
      spans.push({ label: spanLabel, width: (i - spanStart) * columnWidth, left: spanStart * columnWidth, isAltMonth: month % 2 === 0 })
      spanStart = i
      spanLabel = getMonthLabel(days[i])
    }
  }
  const month = parseInt(days[spanStart].slice(5, 7))
  spans.push({ label: spanLabel, width: (days.length - spanStart) * columnWidth, left: spanStart * columnWidth, isAltMonth: month % 2 === 0 })
  return spans
}

/** Returns x offsets (relative to span left) at which to repeat a label. */
function tileOffsets(width: number, interval: number): number[] {
  const offsets: number[] = []
  for (let x = interval / 2; x < width; x += interval) {
    offsets.push(x)
  }
  return offsets.length > 0 ? offsets : [width / 2]
}

const MONTH_LABEL_INTERVAL = 400

export function GanttSection({ days, phases, columnWidth, totalDays, year = YEAR, onPhaseClick, onUpdatePhase, onAddPhase }: Props) {
  const totalWidth = totalDays * columnWidth
  const maxRow = phases.reduce((m, g) => Math.max(m, g.row), -1)
  const numRows = Math.max(maxRow + 1, 1)
  const ganttHeight = numRows * ROW_HEIGHT
  const monthSpans = buildMonthSpans(days, columnWidth)

  return (
    <div className="gantt-section" style={{ width: totalWidth }}>

      {/* Month header — flex layout so each cell owns its own overflow clip */}
      <div className="gantt-month-header">
        {monthSpans.map((span, si) => (
          <div
            key={si}
            className={`gantt-month-cell${span.isAltMonth ? ' alt-month' : ''}`}
            style={{ width: span.width }}
          >
            {tileOffsets(span.width, MONTH_LABEL_INTERVAL).map((offset, i) => (
              <span
                key={i}
                className="gantt-month-text"
                style={{ left: offset }}
              >
                {span.label}
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* Phase bars area */}
      <div
        className="gantt-bars-area"
        style={{ width: totalWidth, height: ganttHeight }}
        onDoubleClick={onAddPhase}
      >
        {monthSpans.filter(s => s.isAltMonth).map((span, i) => (
          <div
            key={i}
            className="gantt-month-stripe"
            style={{ left: span.left, width: span.width, height: ganttHeight }}
          />
        ))}
        {Array.from({ length: numRows }, (_, i) => (
          <div
            key={i}
            className="gantt-row-guide"
            style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT, width: totalWidth }}
          />
        ))}
        {days.map((date, i) =>
          isFirstOfMonth(date) ? (
            <div
              key={date}
              className="gantt-col-guide"
              style={{ left: i * columnWidth, height: ganttHeight }}
            />
          ) : null
        )}

        {phases.map(phase => {
          const startIdx = dayIndexOf(phase.startDate, year)
          const endIdx = dayIndexOf(phase.endDate, year)
          const left = startIdx * columnWidth
          const width = (endIdx - startIdx + 1) * columnWidth
          return (
            <GanttPhaseBar
              key={phase.id}
              phase={phase}
              left={left}
              width={width}
              columnWidth={columnWidth}
              onClick={onPhaseClick}
              onUpdate={onUpdatePhase}
            />
          )
        })}
      </div>
    </div>
  )
}
