import { Users } from 'lucide-react'
import type { VenueRecord } from '../../types/domain'

const integer = new Intl.NumberFormat('en-AU', { maximumFractionDigits: 0 })

export function CatchmentCompetition({ venue }: { venue: VenueRecord }) {
  return (
    <section className="drawer-section catchment-competition-section">
      <div className="section-title"><Users size={17} /><div><span className="eyebrow">Local market</span><h3>Catchment and competition</h3></div></div>
      <div className="map-context-grid">
        <div><span>Population</span><strong>{integer.format(venue.catchment.totalPopulation)}</strong></div>
        <div><span>Population growth</span><strong>{venue.catchment.populationGrowth.toFixed(1)}%</strong></div>
        <div><span>Current competitors</span><strong>{venue.recommendation.currentCompetition.direct} direct</strong><small>{venue.recommendation.currentCompetition.indirect} indirect</small></div>
        <div><span>Recommended set</span><strong>{venue.recommendation.recommendedCompetition.direct} direct</strong><small>{venue.recommendation.recommendedCompetition.indirect} indirect</small></div>
      </div>
      <div className="poi-strip"><span>{venue.catchment.officeCount} offices</span><span>{venue.catchment.transitHubCount} transit hubs</span><span>{venue.catchment.stadiumCount} stadiums</span></div>
    </section>
  )
}
