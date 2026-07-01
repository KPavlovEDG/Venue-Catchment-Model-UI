import { ArrowRight, Building2, CircleDollarSign, MessageSquareText, Sparkles, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { generateVenues } from '../../data/generateVenues'
import { dayparts } from '../../data/schema'
import type { AxisKey, Daypart, VenueComment } from '../../types/domain'
import { AxisProfileExplorer, ProfileSummary } from './AxisProfileExplorer'
import { CatchmentCompetition } from './CatchmentCompetition'
import { CompetitorPopup } from './CompetitorPopup'
import { RadarChart } from './RadarChart'

const money = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', notation: 'compact', maximumFractionDigits: 1 })
const number = new Intl.NumberFormat('en-AU', { maximumFractionDigits: 0 })

interface VenueProfileDrawerProps {
  venueId: string
  initialDaypart: Daypart
  comment: VenueComment
  onCommentChange: (comment: VenueComment) => void
  onClose: () => void
}

interface PopupState {
  state: 'current' | 'recommended'
  type: 'direct' | 'indirect'
}

export function VenueProfileDrawer({ venueId, initialDaypart, comment, onCommentChange, onClose }: VenueProfileDrawerProps) {
  const [drawerDaypart, setDrawerDaypart] = useState<Daypart>(initialDaypart)
  const [selectedAxes, setSelectedAxes] = useState<Set<AxisKey>>(() => new Set())
  const [popup, setPopup] = useState<PopupState | null>(null)
  const venue = useMemo(() => generateVenues(drawerDaypart).find((record) => record.id === venueId)!, [drawerDaypart, venueId])
  const gapLevel = venue.macroGap >= 65 ? 'High gap' : venue.macroGap >= 38 ? 'Moderate gap' : 'Low gap'

  const toggleAxis = (axis: AxisKey) => {
    setSelectedAxes((current) => {
      if (current.size === 0) return new Set([axis])
      const next = new Set(current)
      if (next.has(axis)) next.delete(axis)
      else next.add(axis)
      return next
    })
  }

  const updateComment = (field: keyof Pick<VenueComment, 'currentPositioning' | 'recommendedPositioning' | 'author'>, value: string) => {
    onCommentChange({ ...comment, [field]: value, updatedAt: new Date().toISOString() })
  }

  const popupCompetitors = popup
    ? (popup.state === 'current' ? venue.recommendation.currentCompetitors : venue.recommendation.recommendedCompetitors)
      .filter((competitor) => competitor.type === popup.type)
    : []

  return (
    <aside aria-label={`${venue.name} venue profile`} className="venue-drawer">
      <div className="drawer-header">
        <div className="drawer-header-top"><span className="venue-id"><Building2 size={13} />{venue.id}</span><button aria-label="Close venue profile" onClick={onClose} type="button"><X size={18} /></button></div>
        <div className="drawer-title-row"><div><h2>{venue.name}</h2><p>{venue.region} · {venue.lga}</p></div><label><span>Drawer daypart</span><select aria-label="Drawer daypart" onChange={(event) => setDrawerDaypart(event.target.value as Daypart)} value={drawerDaypart}>{dayparts.map((daypart) => <option key={daypart}>{daypart}</option>)}</select></label></div>
        <div className="drawer-status-row"><span className={`gap-level gap-${venue.macroGap >= 65 ? 'high' : venue.macroGap >= 38 ? 'medium' : 'low'}`}>{gapLevel}</span><span className="macro-score"><strong>{venue.macroGap}</strong>/100 gap</span></div>
      </div>

      <div className="drawer-body">
        <ProfileSummary venue={venue} />
        <CatchmentCompetition venue={venue} />
        <RadarChart onAxisToggle={toggleAxis} selectedAxes={selectedAxes} venue={venue} />
        <AxisProfileExplorer onAxisToggle={toggleAxis} onClear={() => setSelectedAxes(new Set())} selectedAxes={selectedAxes} venue={venue} />

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
          <div className="recommendation-kicker"><Sparkles size={15} /><span>Model recommendation</span><strong>{venue.recommendation.changes.length} attribute shifts</strong></div>
          <div className="recommendation-shifts">
            {venue.recommendation.changes.map((change) => (
              <div className="recommendation-shift" key={change.axis}>
                <span><strong>{change.axisLabel}</strong><small>Gap {change.gap}</small></span>
                <span className="shift-value current">{change.fromLabel}</span>
                <ArrowRight size={14} />
                <span className="shift-value target">{change.toLabel}</span>
              </div>
            ))}
          </div>
          <div className="competitive-set-actions">
            {(['current', 'recommended'] as const).map((state) => {
              const counts = state === 'current' ? venue.recommendation.currentCompetition : venue.recommendation.recommendedCompetition
              return <div key={state}><span>{state === 'current' ? 'Current competitive set' : 'Recommended competitive set'}</span><button aria-label={`${state} direct competitors`} onClick={() => setPopup({ state, type: 'direct' })} type="button"><strong>{counts.direct}</strong> direct</button><button aria-label={`${state} indirect competitors`} onClick={() => setPopup({ state, type: 'indirect' })} type="button"><strong>{counts.indirect}</strong> indirect</button></div>
            })}
          </div>
        </section>

        <section className="operator-comments">
          <div className="section-title"><MessageSquareText size={17} /><div><span className="eyebrow">Human context</span><h3>Positioning comments</h3></div><span className="comment-meta"><small>{comment.updatedAt ? `Updated ${new Date(comment.updatedAt).toLocaleString('en-AU')}` : 'Not yet updated'}</small><button disabled={!comment.currentPositioning && !comment.recommendedPositioning && !comment.author} onClick={() => onCommentChange({ currentPositioning: '', recommendedPositioning: '', author: '', updatedAt: '' })} type="button">Clear</button></span></div>
          <div className="comment-form-grid">
            <label><span>Current positioning comment</span><textarea onChange={(event) => updateComment('currentPositioning', event.target.value)} placeholder="Why should the current positioning be maintained or reconsidered?" value={comment.currentPositioning} /></label>
            <label><span>Recommended positioning comment</span><textarea onChange={(event) => updateComment('recommendedPositioning', event.target.value)} placeholder="Operational context for accepting or rejecting the recommendation" value={comment.recommendedPositioning} /></label>
            <label className="comment-author"><span>Comment by</span><input onChange={(event) => updateComment('author', event.target.value)} placeholder="Name" value={comment.author} /></label>
          </div>
        </section>
      </div>
      {popup && <CompetitorPopup competitors={popupCompetitors} label={`${popup.state === 'current' ? 'Current' : 'Recommended'} ${popup.type} competitors`} onClose={() => setPopup(null)} />}
    </aside>
  )
}
