export interface Task {
  id: string
  title: string
  description: string
  date: string        // YYYY-MM-DD
  completed: boolean
  order: number
}

export interface Phase {
  id: string
  title: string
  startDate: string   // YYYY-MM-DD
  endDate: string     // YYYY-MM-DD
  color: string       // hex
  row: number         // 0-indexed Gantt row
}

export interface AppState {
  tasks: Task[]
  phases: Phase[]
}
