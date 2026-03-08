import { useReducer, useEffect } from 'react'
import { AppState, Task, Phase } from '../types'

type Action =
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'MOVE_TASK'; payload: { id: string; date: string; order: number } }
  | { type: 'REORDER_TASKS'; payload: { date: string; ids: string[] } }
  | { type: 'ADD_PHASE'; payload: Phase }
  | { type: 'UPDATE_PHASE'; payload: Phase }
  | { type: 'DELETE_PHASE'; payload: string }
  | { type: 'LOAD_STATE'; payload: AppState }

/** Greedy interval packing: assign phases to the minimum number of non-overlapping rows. */
function packPhaseRows(phases: Phase[]): Phase[] {
  if (phases.length === 0) return phases
  const sorted = [...phases].sort((a, b) => a.startDate.localeCompare(b.startDate))
  const rowPhases: Phase[][] = []
  const packed = sorted.map(phase => {
    let assignedRow = rowPhases.findIndex(row =>
      !row.some(p => p.startDate <= phase.endDate && p.endDate >= phase.startDate)
    )
    if (assignedRow === -1) {
      assignedRow = rowPhases.length
      rowPhases.push([])
    }
    rowPhases[assignedRow].push(phase)
    return { ...phase, row: assignedRow }
  })
  return packed
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] }

    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t),
      }

    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) }

    case 'MOVE_TASK': {
      const { id, date, order } = action.payload
      return {
        ...state,
        tasks: state.tasks.map(t => t.id === id ? { ...t, date, order } : t),
      }
    }

    case 'REORDER_TASKS': {
      const { date, ids } = action.payload
      const orderMap = new Map(ids.map((id, i) => [id, i]))
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.date === date && orderMap.has(t.id)
            ? { ...t, order: orderMap.get(t.id)! }
            : t
        ),
      }
    }

    case 'ADD_PHASE':
      return { ...state, phases: packPhaseRows([...state.phases, action.payload]) }

    case 'UPDATE_PHASE': {
      const updated = state.phases.map(p => p.id === action.payload.id ? action.payload : p)
      return { ...state, phases: packPhaseRows(updated) }
    }

    case 'DELETE_PHASE':
      return { ...state, phases: state.phases.filter(p => p.id !== action.payload) }

    case 'LOAD_STATE':
      return { tasks: action.payload.tasks, phases: packPhaseRows(action.payload.phases) }

    default:
      return state
  }
}

const STORAGE_KEY = 'runway-state'
const LEGACY_KEY = 'todo-gantt-state'

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY)
    if (raw) {
      const state = JSON.parse(raw)
      // Support old localStorage data that used "goals" key
      const phases = state.phases ?? state.goals ?? []
      return { tasks: state.tasks ?? [], phases: packPhaseRows(phases) }
    }
  } catch {
    // ignore
  }
  return { tasks: [], phases: [] }
}

export function useAppState() {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // ignore
    }
  }, [state])

  return { state, dispatch }
}
