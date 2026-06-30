import { Download, Grid3X3, LoaderCircle, Map, RefreshCw } from 'lucide-react'

interface GlobalHeaderProps {
  lastSynced: string
  isRecalculating: boolean
  onExport: () => void
  onRecalculate: () => void
}

export function GlobalHeader({ lastSynced, isRecalculating, onExport, onRecalculate }: GlobalHeaderProps) {
  return (
    <header className="global-header">
      <div className="brand-lockup">
        <span className="brand-mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <div>
          <strong>Venue Catchment</strong>
          <span>Engine</span>
        </div>
      </div>

      <nav aria-label="Dashboard view" className="view-switcher">
        <button aria-disabled="true" className="view-button" title="Map View is outside this prototype scope" type="button">
          <Map size={15} /> Map View <span className="soon-badge">Soon</span>
        </button>
        <button aria-current="page" className="view-button active" type="button">
          <Grid3X3 size={15} /> Grid View
        </button>
      </nav>

      <div className="header-actions">
        <div className="sync-status">
          <span className={isRecalculating ? 'sync-dot working' : 'sync-dot'} />
          <span>Last synced</span>
          <strong>{lastSynced}</strong>
        </div>
        <button className="button secondary" onClick={onExport} type="button">
          <Download size={16} /> Export List
        </button>
        <button className="button primary" disabled={isRecalculating} onClick={onRecalculate} type="button">
          {isRecalculating ? <LoaderCircle className="spin" size={16} /> : <RefreshCw size={16} />}
          {isRecalculating ? 'Recalculating…' : 'Recalculate Model'}
        </button>
      </div>
    </header>
  )
}

