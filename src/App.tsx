import { useState, useRef, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { useAppState } from './hooks/useAppState'
import { generateYearDays, todayStr, dayIndexOf } from './utils/dates'
import { ZOOM_LEVELS, YEAR, ROW_HEIGHT } from './constants'
import { Task, Phase } from './types'
import { ZoomControls } from './components/ZoomControls/ZoomControls'
import { BackupPanel } from './components/BackupPanel/BackupPanel'
import { GanttSection } from './components/GanttSection/GanttSection'
import { TodoSection } from './components/TodoSection/TodoSection'
import { TaskModal } from './components/TaskModal/TaskModal'
import { PhaseModal } from './components/GoalModal/GoalModal'
import { TaskDndContext } from './dnd/TaskDndContext'
import { PhaseDndContext } from './dnd/GoalDndContext'
import { AboutModal } from './components/AboutModal/AboutModal'
import { useBackupFile } from './hooks/useBackupFile'
import { formatBackup } from './utils/backup'
import { IS_DEMO } from './hooks/useAppState'
import './App.css'

function newId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export default function App() {
  const { state, dispatch } = useAppState()
  const { write: writeBackup } = useBackupFile()

  // Auto-write backup on every state change (skip in demo mode)
  useEffect(() => {
    if (IS_DEMO) return
    writeBackup(formatBackup(state))
  // writeBackup is stable (useCallback); state is the trigger
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const [selectedYear, setSelectedYear] = useState(YEAR)
  const days = generateYearDays(selectedYear)
  const [zoom, setZoom] = useState(0)
  const [showAbout, setShowAbout] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [editPhase, setEditPhase] = useState<Phase | null>(null)
  const [contextMenu, setContextMenu] = useState<{ task: Task; x: number; y: number } | null>(null)
  const GANTT_HEADER_HEIGHT = 22
  const GANTT_BTN_SPACE = 55 // room for the "+ Add Phase" button (28px) + 27px bottom offset
  const initialNumRows = Math.max(state.phases.reduce((m, p) => Math.max(m, p.row), -1) + 1, 1)
  const [ganttPanelHeight, setGanttPanelHeight] = useState(
    Math.min(GANTT_HEADER_HEIGHT + initialNumRows * ROW_HEIGHT + GANTT_BTN_SPACE, window.innerHeight / 2)
  )

  // Recalculate height when phases load (needed for demo mode where data loads async)
  useEffect(() => {
    const numRows = Math.max(state.phases.reduce((m, p) => Math.max(m, p.row), -1) + 1, 1)
    const ideal = Math.min(GANTT_HEADER_HEIGHT + numRows * ROW_HEIGHT + GANTT_BTN_SPACE, window.innerHeight / 2)
    setGanttPanelHeight(prev => Math.max(prev, ideal))
  }, [state.phases])
  const [containerWidth, setContainerWidth] = useState(window.innerWidth)
  const ganttScrollRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef<{ y: number; height: number } | null>(null)
  const centerDayRef = useRef<number | null>(null)
  const zoomRef = useRef(zoom)
  const columnWidthRef = useRef(ZOOM_LEVELS[zoom].columnWidth)

  const isYearView = zoom === 0
  const columnWidth = isYearView
    ? Math.max(1, containerWidth / days.length)
    : ZOOM_LEVELS[zoom].columnWidth
  const today = todayStr()

  // Track container width for year-view responsive column sizing
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      setContainerWidth(entries[0].contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Keep refs in sync for use inside zoom centering
  useEffect(() => { zoomRef.current = zoom }, [zoom])
  useEffect(() => { columnWidthRef.current = columnWidth }, [columnWidth])

  // Sync horizontal scroll bidirectionally
  useEffect(() => {
    const todo = scrollRef.current
    const gantt = ganttScrollRef.current
    if (!todo || !gantt) return
    let syncing = false
    const onTodoScroll = () => {
      if (syncing) return
      syncing = true
      gantt.scrollLeft = todo.scrollLeft
      syncing = false
    }
    const onGanttScroll = () => {
      if (syncing) return
      syncing = true
      todo.scrollLeft = gantt.scrollLeft
      syncing = false
    }
    todo.addEventListener('scroll', onTodoScroll)
    gantt.addEventListener('scroll', onGanttScroll)
    return () => {
      todo.removeEventListener('scroll', onTodoScroll)
      gantt.removeEventListener('scroll', onGanttScroll)
    }
  }, [])

  function setScrollLeft(x: number) {
    if (scrollRef.current) scrollRef.current.scrollLeft = x
    if (ganttScrollRef.current) ganttScrollRef.current.scrollLeft = x
  }

  // Scroll to start of year when year changes
  useEffect(() => {
    const todayIdx = dayIndexOf(today, selectedYear)
    // If today is in this year, scroll to it; otherwise scroll to start
    const idx = today.startsWith(String(selectedYear)) ? todayIdx : 0
    setScrollLeft(Math.max(0, idx * columnWidth - 200))
  // Run on mount and when year changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear])

  // After a zoom change, restore scroll so the same day stays centered
  useEffect(() => {
    const el = scrollRef.current
    if (el && centerDayRef.current !== null) {
      setScrollLeft(centerDayRef.current * columnWidth - el.clientWidth / 2)
      centerDayRef.current = null
    }
  }, [columnWidth])

  function handleZoomChange(newZoom: number) {
    const el = scrollRef.current
    if (el) {
      centerDayRef.current = (el.scrollLeft + el.clientWidth / 2) / columnWidthRef.current
    }
    setZoom(newZoom)
  }

  function handleAddTask(date: string) {
    const dateTasks = state.tasks.filter(t => t.date === date)
    const order = dateTasks.length
    const task: Task = {
      id: newId(),
      title: 'New Task',
      description: '',
      date,
      completed: false,
      order,
    }
    dispatch({ type: 'ADD_TASK', payload: task })
    setEditTask(task)
  }

  const closeContextMenu = useCallback(() => setContextMenu(null), [])

  useEffect(() => {
    if (!contextMenu) return
    document.addEventListener('mousedown', closeContextMenu)
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeContextMenu() })
    return () => document.removeEventListener('mousedown', closeContextMenu)
  }, [contextMenu, closeContextMenu])

  function handleResizerMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    dragStartRef.current = { y: e.clientY, height: ganttPanelHeight }
    document.body.style.cursor = 'ns-resize'
    document.body.style.userSelect = 'none'

    function onMouseMove(ev: MouseEvent) {
      if (!dragStartRef.current) return
      const delta = ev.clientY - dragStartRef.current.y
      setGanttPanelHeight(Math.max(40, dragStartRef.current.height + delta))
    }
    function onMouseUp() {
      dragStartRef.current = null
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  function handleTodayClick() {
    const DAY_ZOOM = ZOOM_LEVELS.findIndex(l => l.label === 'Day')
    const todayIdx = dayIndexOf(today, selectedYear)
    const cw = ZOOM_LEVELS[DAY_ZOOM].columnWidth
    // Center today's column in the viewport
    const targetScroll = (todayIdx + 0.5) * cw - (scrollRef.current?.clientWidth ?? 800) / 2
    if (zoom === DAY_ZOOM) {
      setScrollLeft(Math.max(0, targetScroll))
    } else {
      centerDayRef.current = todayIdx + 0.5
      setZoom(DAY_ZOOM)
    }
    setSelectedYear(YEAR)
  }

  function handleGroupHeaderClick(firstDate: string) {
    const el = scrollRef.current
    const dayIdx = dayIndexOf(firstDate, selectedYear)
    // Center on middle of the group: ~15 days for month groups, ~3 for week groups
    if (el) {
      centerDayRef.current = dayIdx + (zoom === 0 ? 15 : 3)
    }
    setZoom(prev => Math.min(ZOOM_LEVELS.length - 1, prev + 1))
  }

  function handleTaskContextMenu(task: Task, x: number, y: number) {
    setContextMenu({ task, x, y })
  }

  function handleCompleteTask() {
    if (!contextMenu) return
    dispatch({ type: 'UPDATE_TASK', payload: { ...contextMenu.task, completed: !contextMenu.task.completed } })
    setContextMenu(null)
  }

  function handleDeleteTask() {
    if (!contextMenu) return
    dispatch({ type: 'DELETE_TASK', payload: contextMenu.task.id })
    setContextMenu(null)
  }

  function handleAddPhase() {
    const phase: Phase = {
      id: newId(),
      title: 'New Phase',
      startDate: today,
      endDate: format(new Date(selectedYear, 11, 31), 'yyyy-MM-dd'),
      color: '#4f8ef7',
      row: 0, // will be overridden by packPhaseRows in reducer
    }
    dispatch({ type: 'ADD_PHASE', payload: phase })
    setEditPhase(phase)
  }

  return (
    <div className={`app${isYearView ? ' year-view' : ''}`}>
      <header className="app-header">
        <button className="about-btn" onClick={() => setShowAbout(true)} title="About">Runway</button>
        <div className="year-nav">
          <button className="year-nav-btn" onClick={() => setSelectedYear(y => y - 1)}>&#8249;</button>
          <span className="year-nav-label">{selectedYear}</span>
          <button className="year-nav-btn" onClick={() => setSelectedYear(y => y + 1)}>&#8250;</button>
        </div>
        <div className="header-controls">
          <button className="today-btn" onClick={handleTodayClick}>Today</button>
          <div className="header-divider" />
          <ZoomControls zoom={zoom} onZoomChange={handleZoomChange} />
          <div className="header-divider" />
          <BackupPanel
            state={state}
            onImport={loaded => dispatch({ type: 'LOAD_STATE', payload: loaded })}
          />
        </div>
      </header>

      <div className="gantt-panel" style={{ height: ganttPanelHeight }}>
        <div className="gantt-scroll" ref={ganttScrollRef}>
          <PhaseDndContext
            columnWidth={columnWidth}
            phases={state.phases}
            year={selectedYear}
            onUpdatePhase={phase => dispatch({ type: 'UPDATE_PHASE', payload: phase })}
          >
            <GanttSection
              days={days}
              phases={state.phases}
              columnWidth={columnWidth}
              totalDays={days.length}
              year={selectedYear}
              onPhaseClick={setEditPhase}
              onUpdatePhase={phase => dispatch({ type: 'UPDATE_PHASE', payload: phase })}
              onAddPhase={handleAddPhase}
            />
          </PhaseDndContext>
        </div>
        <button className="gantt-add-btn" onClick={handleAddPhase} title="Add Phase">
          + Add Phase
        </button>
      </div>

      <div className="gantt-resizer" onMouseDown={handleResizerMouseDown} />

      <div className="todo-scroll" ref={scrollRef}>
        <TaskDndContext
          tasks={state.tasks}
          onMoveTask={(id, date, order) =>
            dispatch({ type: 'MOVE_TASK', payload: { id, date, order } })
          }
          onReorderTasks={(date, ids) =>
            dispatch({ type: 'REORDER_TASKS', payload: { date, ids } })
          }
        >
          <TodoSection
            days={days}
            tasks={state.tasks}
            columnWidth={columnWidth}
            onTaskClick={setEditTask}
            onTaskContextMenu={handleTaskContextMenu}
            onAddTask={handleAddTask}
            onGroupHeaderClick={handleGroupHeaderClick}
          />
        </TaskDndContext>
      </div>

      <TaskModal
        task={editTask}
        onSave={task => dispatch({ type: 'UPDATE_TASK', payload: task })}
        onDelete={id => dispatch({ type: 'DELETE_TASK', payload: id })}
        onClose={() => setEditTask(null)}
      />

      <PhaseModal
        phase={editPhase}
        onSave={phase => dispatch({ type: 'UPDATE_PHASE', payload: phase })}
        onDelete={id => dispatch({ type: 'DELETE_PHASE', payload: id })}
        onClose={() => setEditPhase(null)}
      />

      {contextMenu && (
        <div
          className="task-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onMouseDown={e => e.stopPropagation()}
        >
          <button className="context-menu-item" onClick={handleCompleteTask}>
            {contextMenu.task.completed ? 'Mark Incomplete' : 'Mark Complete'}
          </button>
          <button className="context-menu-item danger" onClick={handleDeleteTask}>
            Delete
          </button>
        </div>
      )}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </div>
  )
}
