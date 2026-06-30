import { ArrowRight, Building2, MapPin, Target, Users, X } from 'lucide-react'
import { axisDefinitions } from '../../data/schema'
import type { MapMetric, VenueRecord } from '../../types/domain'

const integer = new Intl.NumberFormat('en-AU', { maximumFractionDigits: 0 })

interface MapVenuePanelProps {
  venue: VenueRecord
  focusMetric: MapMetric
  onClose: () => void
}

function level(score: number) {
  return score >= 65 ? 'high' : score >= 38 ? 'medium' : 'low'
}

export function MapVenuePanel({ venue, focusMetric, onClose }: MapVenuePanelProps) {
  const focusedAxis = focusMetric === 'overall' ? null : axisDefinitions.find((axis) => axis.key === focusMetric)!
  const focusedScore = focusedAxis ? venue.axes[focusedAxis.key].gap : venue.macroGap
  const sortedAxes = [...axisDefinitions].sort((left, right) => venue.axes[right.key].gap - venue.axes[left.key].gap)

  return (
    <aside aria-label={`${venue.name} map summary`} className="map-venue-panel">
      <header className="map-panel-header">
        <div className="map-panel-topline"><span><Building2 size={12} />{venue.id}</span><button aria-label="Close map venue summary" onClick={onClose} type="button"><X size={17} /></button></div>
        <h2>{venue.name}</h2>
        <p><MapPin size={13} />{venue.region} · {venue.lga}</p>
        <div className="map-focus-score">
          <span><small>{focusedAxis ? focusedAxis.label.replace(/^Axis \d+: /, '') : 'Overall opportunity'}</small><strong>{focusedScore}</strong></span>
          <div className="map-score-track"><i className={`gap-${level(focusedScore)}`} style={{ width: `${focusedScore}%` }} /></div>
        </div>
      </header>

      <div className="map-panel-body">
        <section className="map-panel-section">
          <div className="map-section-title"><Target size={15} /><div><span>Priority shifts</span><strong>Highest-variance attributes</strong></div></div>
          <div className="map-shift-list">
            {venue.recommendation.changes.map((change) => (
              <div className="map-shift-row" key={change.axis}>
                <div><span>{change.axisLabel}</span><small>Gap {change.gap}</small></div>
                <strong>[{change.fromCode}] {change.fromLabel}</strong>
                <ArrowRight size={13} />
                <strong className="target">[{change.toCode}] {change.toLabel}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="map-panel-section">
          <div className="map-section-title"><Users size={15} /><div><span>Local market</span><strong>Catchment and competition</strong></div></div>
          <div className="map-context-grid">
            <div><span>Population</span><strong>{integer.format(venue.catchment.totalPopulation)}</strong></div>
            <div><span>Population growth</span><strong>{venue.catchment.populationGrowth.toFixed(1)}%</strong></div>
            <div><span>Current competitors</span><strong>{venue.recommendation.currentCompetition.direct} direct</strong><small>{venue.recommendation.currentCompetition.indirect} indirect</small></div>
            <div><span>Recommended set</span><strong>{venue.recommendation.recommendedCompetition.direct} direct</strong><small>{venue.recommendation.recommendedCompetition.indirect} indirect</small></div>
          </div>
          <div className="poi-strip"><span>{venue.catchment.officeCount} offices</span><span>{venue.catchment.transitHubCount} transit hubs</span><span>{venue.catchment.stadiumCount} stadiums</span></div>
        </section>

        <section className="map-panel-section axis-profile-section">
          <div className="map-section-title"><div><span>Eight-axis profile</span><strong>Venue-to-catchment variance</strong></div></div>
          <div className="map-axis-list">
            {sortedAxes.map((axis) => {
              const score = venue.axes[axis.key].gap
              return (
                <div className={focusMetric === axis.key ? 'focused' : ''} key={axis.key}>
                  <span>{axis.prompt}</span><strong>{score}</strong><i><b className={`gap-${level(score)}`} style={{ width: `${score}%` }} /></i>
                </div>
              )
            })}
          </div>
        </section>

        <section className="map-recommendation">
          <span>Recommended response</span>
          <strong>{venue.recommendation.action}</strong>
        </section>
      </div>
    </aside>
  )
}
