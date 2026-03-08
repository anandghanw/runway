import { ZOOM_LEVELS } from '../../constants'
import './ZoomControls.css'

interface Props {
  zoom: number
  onZoomChange: (zoom: number) => void
}

export function ZoomControls({ zoom, onZoomChange }: Props) {
  return (
    <div className="zoom-controls">
      {ZOOM_LEVELS.map((level, i) => (
        <button
          key={level.label}
          className={`zoom-btn${zoom === i ? ' active' : ''}`}
          onClick={() => onZoomChange(i)}
        >
          {level.label}
        </button>
      ))}
    </div>
  )
}
