import { useState, useEffect } from 'react'
import { Phase } from '../../types'
import './GoalModal.css'

interface Props {
  phase: Phase | null
  onSave: (phase: Phase) => void
  onDelete: (id: string) => void
  onClose: () => void
}

const PRESET_COLORS = [
  '#4f8ef7', '#e85d4a', '#f5a623', '#27ae60',
  '#9b59b6', '#1abc9c', '#e67e22', '#e91e63',
]

export function PhaseModal({ phase, onSave, onDelete, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [color, setColor] = useState('#4f8ef7')

  useEffect(() => {
    if (phase) {
      setTitle(phase.title)
      setStartDate(phase.startDate)
      setEndDate(phase.endDate)
      setColor(phase.color)
    }
  }, [phase])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!phase) return null

  function handleSave() {
    if (!phase) return
    onSave({ ...phase, title: title.trim() || 'Untitled', startDate, endDate, color })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Phase</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
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
        <div className="phase-dates">
          <label className="modal-field">
            <span>Start Date</span>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} onClick={e => (e.target as HTMLInputElement).showPicker?.()} />
          </label>
          <label className="modal-field">
            <span>End Date</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} onClick={e => (e.target as HTMLInputElement).showPicker?.()} />
          </label>
        </div>
        <div className="modal-field">
          <span>Color</span>
          <div className="color-grid">
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                className={`color-swatch${color === c ? ' selected' : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="color-custom"
              title="Custom color"
            />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-danger" onClick={() => { onDelete(phase.id); onClose() }}>
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
