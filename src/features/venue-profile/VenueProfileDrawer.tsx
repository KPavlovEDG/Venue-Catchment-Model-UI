import { ArrowRight, Building2, CircleDollarSign, MapPin, Sparkles, X } from 'lucide-react'
import type { VenueRecord } from '../../types/domain'
import { RadarChart } from './RadarChart'

const money = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', notation: 'compact', maximumFractionDigits: 1 })
const number = new Intl.NumberFormat('en-AU', { maximumFractionDigits: 0 })

interface VenueProfileDrawerProps {
  venue: VenueRecord
  onClose: () => void
}

export function VenueProfileDrawer({ venue, onClose }: VenueProfileDrawerProps) {
  const gapLevel = venue.macroGap >= 65 ? 'High gap' : venue.macroGap >= 38 ? 'Moderate gap' : 'Low gap'

  return (
    <aside aria-label={`${venue.name} venue profile`} className="venue-drawer">
      <div className="drawer-header">
        <div className="drawer-header-top"><span className="venue-id"><Building2 size={13} />{venue.id}</span><button aria-label="Close venue profile" onClick={onClose} type="button"><X size={18} /></button></div>
        <h2>{venue.name}</h2>
        <p><MapPin size={14} /> {venue.region} · {venue.lga}</p>
        <div className="drawer-status-row"><span className={`gap-level gap-${venue.macroGap >= 65 ? 'high' : venue.macroGap >= 38 ? 'medium' : 'low'}`}>{gapLevel}</span><span className="macro-score"><strong>{venue.macroGap}</strong>/100 gap</span></div>
      </div>

      <div className="drawer-body">
        <section className="cluster-shift">
          <div><span>Current cluster</span><strong>{venue.currentCluster}</strong></div>
          <ArrowRight size={18} />
          <div><span>Target cluster</span><strong>{venue.targetCluster}</strong></div>
        </section>

        <RadarChart venue={venue} />

        <section className="drawer-section">
          <div className="section-title"><CircleDollarSign size={17} /><div><span className="eyebrow">Financial audit</span><h3>Commercial health</h3></div></div>
          <div className="financial-matrix">
            <div><span>12M rolling EBIT</span><strong>{money.format(venue.financials.rollingEbit)}</strong></div>
            <div><span>EBITDA growth</span><strong className={venue.financials.ebitdaGrowth < 0 ? 'negative' : 'positive'}>{venue.financials.ebitdaGrowth.toFixed(1)}%</strong></div>
            <div><span>ROI</span><strong>{venue.financials.roi.toFixed(1)}%</strong></div>
            <div><span>Funds employed</span><strong>{money.format(venue.financials.fundsEmployed)}</strong></div>
            <div className="wide"><span>Trading density</span><strong>${number.format(venue.financials.tradingDensity)} / m²</strong></div>
          </div>
        </section>

        <section className="recommendation-card">
          <div className="recommendation-kicker"><Sparkles size={15} /><span>Automated recommendation</span><strong>{venue.recommendation.changes.length} priority shifts</strong></div>
          <h3>{venue.recommendation.action}</h3>
          <div className="recommendation-shifts">
            {venue.recommendation.changes.map((change) => (
              <div className="recommendation-shift" key={change.axis}>
                <span><strong>{change.axisLabel}</strong><small>Gap {change.gap}</small></span>
                <span className="shift-value current">[{change.fromCode}] {change.fromLabel}</span>
                <ArrowRight size={14} />
                <span className="shift-value target">[{change.toCode}] {change.toLabel}</span>
              </div>
            ))}
          </div>
          <div className="competition-comparison">
            <div><span>Current competitive set</span><strong>{venue.recommendation.currentCompetition.direct} direct</strong><small>{venue.recommendation.currentCompetition.indirect} indirect</small></div>
            <ArrowRight size={16} />
            <div><span>Recommended set</span><strong>{venue.recommendation.recommendedCompetition.direct} direct</strong><small>{venue.recommendation.recommendedCompetition.indirect} indirect</small></div>
          </div>
        </section>
      </div>
    </aside>
  )
}
