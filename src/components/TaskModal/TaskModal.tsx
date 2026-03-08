import { useState, useEffect } from 'react'
import { Task } from '../../types'
import './TaskModal.css'

interface Props {
  task: Task | null
  onSave: (task: Task) => void
  onDelete: (id: string) => void
  onClose: () => void
}

export function TaskModal({ task, onSave, onDelete, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [completed, setCompleted] = useState(false)
  const [date, setDate] = useState('')

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description)
      setCompleted(task.completed)
      setDate(task.date)
    }
  }, [task])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!task) return null

  function handleSave() {
    if (!task) return
    onSave({ ...task, title: title.trim() || 'Untitled', description, completed, date: date || task.date })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Task</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <label className="modal-field">
          <span>Date</span>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} onClick={e => (e.target as HTMLInputElement).showPicker?.()} />
        </label>
        <label className="modal-field">
          <span>Title</span>
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            onFocus={e => e.target.select()}
          />
        </label>
        <label className="modal-field">
          <span>Description</span>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
          />
        </label>
        <label className="modal-checkbox">
          <input
            type="checkbox"
            checked={completed}
            onChange={e => setCompleted(e.target.checked)}
          />
          <span>Completed</span>
        </label>
        <div className="modal-actions">
          <button className="btn-danger" onClick={() => { onDelete(task.id); onClose() }}>
            Delete
          </button>
          <div style={{ flex: 1 }} />
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}
