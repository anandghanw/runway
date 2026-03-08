import './AboutModal.css'

interface Props {
  onClose: () => void
}

export function AboutModal({ onClose }: Props) {
  return (
    <div className="about-overlay" onClick={onClose}>
      <div className="about-modal" onClick={e => e.stopPropagation()}>
        <div className="about-title">Runway</div>
        <div className="about-version">v1.0.0</div>

        <p className="about-story">
          I always liked todo lists — but they had no sense of scale across time.
          Runway combines a Gantt-style timeline for long-term phases with a task panel
          for day-to-day work. Both connected. Also works as a work diary you can
          export and hand to an LLM.
        </p>

        <div className="about-links">
          <a
            href="https://github.com/anandghanw/runway"
            target="_blank"
            rel="noreferrer"
          >
            github.com/anandghanw/runway
          </a>
        </div>

        <div className="about-footer">
          Vibe coded with Claude Code over a weekend
        </div>

        <button className="about-close" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}
