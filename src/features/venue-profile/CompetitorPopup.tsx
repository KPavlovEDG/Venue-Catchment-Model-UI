import { Building2, MapPin, X } from 'lucide-react'
import type { CompetitorDetail } from '../../types/domain'

interface CompetitorPopupProps {
  competitors: CompetitorDetail[]
  label: string
  onClose: () => void
}

export function CompetitorPopup({ competitors, label, onClose }: CompetitorPopupProps) {
  return (
    <div className="competitor-popup-backdrop" onClick={onClose} role="presentation">
      <section aria-label={`${label} competitor details`} aria-modal="true" className="competitor-popup" onClick={(event) => event.stopPropagation()} role="dialog">
        <header><div><span className="eyebrow">Competitive set details</span><h3>{label}</h3><p>{competitors.length} matching {competitors.length === 1 ? 'venue' : 'venues'}</p></div><button aria-label="Close competitor details" onClick={onClose} type="button"><X size={17} /></button></header>
        <div className="competitor-popup-list">
          {competitors.length === 0 ? <div className="empty-competitors">No competitors meet this overlap threshold.</div> : competitors.map((competitor) => (
            <article key={competitor.id}>
              <div className="competitor-name"><Building2 size={14} /><div><strong>{competitor.name}</strong><span><MapPin size={11} />{competitor.address}</span></div><small>{competitor.type}</small></div>
              <div className="overlap-list"><span>Overlapping attributes</span><div>{competitor.overlappingAttributes.map((attribute) => <span key={`${attribute.axis}-${attribute.code}`}><small>{attribute.axisLabel}</small><strong>{attribute.label}</strong></span>)}</div></div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
