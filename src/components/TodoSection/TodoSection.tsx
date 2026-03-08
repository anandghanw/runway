import { format } from 'date-fns'
import { Task } from '../../types'
import { DayColumn } from './DayColumn'
import { WeekColumn } from './WeekColumn'
import { todayStr } from '../../utils/dates'
import './TodoSection.css'

interface Props {
  days: string[]
  tasks: Task[]
  columnWidth: number
  onTaskClick: (task: Task) => void
  onTaskContextMenu: (task: Task, x: number, y: number) => void
  onAddTask: (date: string) => void
  onGroupHeaderClick: (firstDate: string) => void
}

function weekOfMonth(dateStr: string): number {
  return Math.ceil(parseInt(dateStr.slice(8, 10)) / 7)
}

interface WeekSpan {
  label: string
  width: number
  isAltMonth: boolean
  isAltWeek: boolean
}

interface MonthHeaderSpan {
  label: string
  width: number
  isAltMonth: boolean
}

function buildWeekSpansForMonths(days: string[], columnWidth: number): MonthHeaderSpan[] {
  const spans: MonthHeaderSpan[] = []
  let spanStart = 0
  for (let i = 1; i < days.length; i++) {
    if (days[i].slice(5, 7) !== days[spanStart].slice(5, 7)) {
      const month = parseInt(days[spanStart].slice(5, 7))
      spans.push({ label: format(new Date(days[spanStart] + 'T00:00:00'), 'MMM'), width: (i - spanStart) * columnWidth, isAltMonth: month % 2 === 0 })
      spanStart = i
    }
  }
  const month = parseInt(days[spanStart].slice(5, 7))
  spans.push({ label: format(new Date(days[spanStart] + 'T00:00:00'), 'MMM'), width: (days.length - spanStart) * columnWidth, isAltMonth: month % 2 === 0 })
  return spans
}

function buildWeekSpans(days: string[], columnWidth: number): WeekSpan[] {
  const spans: WeekSpan[] = []
  let spanStart = 0

  for (let i = 1; i < days.length; i++) {
    // New week starts on Monday
    if (new Date(days[i] + 'T00:00:00').getDay() === 1) {
      const month = parseInt(days[spanStart].slice(5, 7))
      const wk = weekOfMonth(days[spanStart])
      spans.push({ label: `Week ${wk}`, width: (i - spanStart) * columnWidth, isAltMonth: month % 2 === 0, isAltWeek: wk % 2 === 0 })
      spanStart = i
    }
  }
  const month = parseInt(days[spanStart].slice(5, 7))
  const wk = weekOfMonth(days[spanStart])
  spans.push({ label: `Week ${wk}`, width: (days.length - spanStart) * columnWidth, isAltMonth: month % 2 === 0, isAltWeek: wk % 2 === 0 })
  return spans
}

interface Group {
  dates: string[]
  label: string
  isAltMonth: boolean
  isCurrent: boolean
}

function buildWeekGroups(days: string[], today: string): Group[] {
  const groups: Group[] = []
  let spanStart = 0
  for (let i = 1; i < days.length; i++) {
    if (new Date(days[i] + 'T00:00:00').getDay() === 1) {
      const dates = days.slice(spanStart, i)
      const month = parseInt(dates[0].slice(5, 7))
      groups.push({ dates, label: `Week ${weekOfMonth(dates[0])}`, isAltMonth: month % 2 === 0, isCurrent: dates.includes(today) })
      spanStart = i
    }
  }
  const dates = days.slice(spanStart)
  const month = parseInt(dates[0].slice(5, 7))
  groups.push({ dates, label: `Week ${weekOfMonth(dates[0])}`, isAltMonth: month % 2 === 0, isCurrent: dates.includes(today) })
  return groups
}

function buildMonthGroups(days: string[], today: string): Group[] {
  const groups: Group[] = []
  let spanStart = 0
  for (let i = 1; i < days.length; i++) {
    if (days[i].slice(5, 7) !== days[spanStart].slice(5, 7)) {
      const dates = days.slice(spanStart, i)
      const month = parseInt(dates[0].slice(5, 7))
      groups.push({
        dates,
        label: format(new Date(dates[0] + 'T00:00:00'), 'MMM'),
        isAltMonth: month % 2 === 0,
        isCurrent: dates.includes(today),
      })
      spanStart = i
    }
  }
  const dates = days.slice(spanStart)
  const month = parseInt(dates[0].slice(5, 7))
  groups.push({
    dates,
    label: format(new Date(dates[0] + 'T00:00:00'), 'MMM'),
    isAltMonth: month % 2 === 0,
    isCurrent: dates.includes(today),
  })
  return groups
}

const today = todayStr()

export function TodoSection({ days, tasks, columnWidth, onTaskClick, onTaskContextMenu, onAddTask, onGroupHeaderClick }: Props) {
  const tasksByDate = tasks.reduce<Record<string, Task[]>>((acc, task) => {
    if (!acc[task.date]) acc[task.date] = []
    acc[task.date].push(task)
    return acc
  }, {})

  const isDayView = columnWidth >= 100
  const isYearView = columnWidth < 20
  const isMonthView = !isDayView && !isYearView

  const groups = isYearView
    ? buildMonthGroups(days, today)
    : buildWeekGroups(days, today)

  // Month spans for the month-view header row (mirrors GanttSection month header)
  const monthHeaderSpans = isMonthView ? buildWeekSpansForMonths(days, columnWidth) : []

  return (
    <div className="todo-section">
      {isDayView && (
        <div className="week-header-row">
          {buildWeekSpans(days, columnWidth).map((span, i) => (
            <div key={i} className={`week-header-cell${span.isAltWeek ? ' alt-week' : ''}`} style={{ width: span.width }}>
              {span.label}
            </div>
          ))}
        </div>
      )}
      {isMonthView && (
        <div className="week-header-row">
          {monthHeaderSpans.map((span, i) => (
            <div key={i} className={`week-header-cell${span.isAltMonth ? ' alt-month' : ''}`} style={{ width: span.width }}>
              {span.label}
            </div>
          ))}
        </div>
      )}
      <div className="day-columns-row">
        {isDayView
          ? days.map(date => (
              <DayColumn
                key={date}
                date={date}
                tasks={tasksByDate[date] ?? []}
                columnWidth={columnWidth}
                isToday={date === today}
                isAltMonth={false}
                isAltWeek={weekOfMonth(date) % 2 === 0}
                onTaskClick={onTaskClick}
                onTaskContextMenu={onTaskContextMenu}
                onAddTask={onAddTask}
              />
            ))
          : groups.map(group => {
              const groupTasks = group.dates.flatMap(d => tasksByDate[d] ?? [])
              return (
                <WeekColumn
                  key={group.dates[0]}
                  dates={group.dates}
                  tasks={groupTasks}
                  totalWidth={group.dates.length * columnWidth}
                  label={group.label}
                  isCurrent={group.isCurrent}
                  isAltMonth={group.isAltMonth}
                  headerTop={isMonthView ? 24 : 0}
                  onHeaderClick={onGroupHeaderClick}
                  onTaskClick={onTaskClick}
                  onTaskContextMenu={onTaskContextMenu}
                  onAddTask={onAddTask}
                />
              )
            })
        }
      </div>
    </div>
  )
}
