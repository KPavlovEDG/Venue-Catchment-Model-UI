import { RotateCcw } from 'lucide-react'
import { axisDefinitions } from '../../data/schema'
import type { AxisKey, VenueRecord } from '../../types/domain'

interface AxisSelectionProps {
  venue: VenueRecord
  selectedAxes: Set<AxisKey>
  onAxisToggle: (axis: AxisKey) => void
  onClear: () => void
}

function attributeLabel(axisKey: AxisKey, code: string) {
  return axisDefinitions.find((axis) => axis.key === axisKey)!.attributes.find((attribute) => attribute.code === code)!.label
}

export function ProfileSummary({ venue }: { venue: VenueRecord }) {
  return (
    <section className="profile-summary">
      <div className="profile-summary-heading"><span className="eyebrow">Combinatorial profiles</span><h3>Dominant attributes across all eight axes</h3></div>
      <div className="profile-summary-grid">
        <div className="profile-card venue-profile-card">
          <header><span>Venue profile</span><strong>Current supply</strong></header>
          <div>{axisDefinitions.map((axis) => <span key={axis.key}><small>{axis.label.replace(/^Axis \d+: /, '')}</small><strong>{attributeLabel(axis.key, venue.axes[axis.key].currentDominant)}</strong></span>)}</div>
        </div>
        <div className="profile-card catchment-profile-card">
          <header><span>Catchment profile</span><strong>Local demand</strong></header>
          <div>{axisDefinitions.map((axis) => <span key={axis.key}><small>{axis.label.replace(/^Axis \d+: /, '')}</small><strong>{attributeLabel(axis.key, venue.axes[axis.key].targetDominant)}</strong></span>)}</div>
        </div>
      </div>
    </section>
  )
}

export function AxisProfileExplorer({ venue, selectedAxes, onAxisToggle, onClear }: AxisSelectionProps) {
  const visibleAxes = selectedAxes.size === 0 ? axisDefinitions : axisDefinitions.filter((axis) => selectedAxes.has(axis.key))
  return (
    <section className="axis-explorer">
      <div className="axis-explorer-heading">
        <div><span className="eyebrow">Attribute deep dive</span><h3>{selectedAxes.size === 0 ? 'All strategic axes' : `${selectedAxes.size} selected ${selectedAxes.size === 1 ? 'axis' : 'axes'}`}</h3></div>
        <button disabled={selectedAxes.size === 0} onClick={onClear} type="button"><RotateCcw size={13} /> Show all axes</button>
      </div>
      <div className="axis-selection-chips">
        {axisDefinitions.map((axis, index) => <button className={selectedAxes.has(axis.key) ? 'active' : ''} key={axis.key} onClick={() => onAxisToggle(axis.key)} type="button"><span>A{index + 1}</span>{axis.label.replace(/^Axis \d+: /, '')}</button>)}
      </div>
      <div className="axis-explorer-list">
        {visibleAxes.map((axis) => {
          const profile = venue.axes[axis.key]
          return (
            <article className="axis-detail-card" key={axis.key}>
              <header>
                <div><span>{axis.prompt}</span><h4>{axis.label.replace(/^Axis \d+: /, '')}</h4></div>
                <strong className={`gap-${profile.gap >= 65 ? 'high' : profile.gap >= 38 ? 'medium' : 'low'}`}>{profile.gap} gap</strong>
              </header>
              <div className="axis-dominants"><span>Venue: <strong>{attributeLabel(axis.key, profile.currentDominant)}</strong></span><span>Catchment: <strong>{attributeLabel(axis.key, profile.targetDominant)}</strong></span></div>
              <div className="attribute-comparison-header"><span>Attribute</span><span>Venue</span><span>Catchment</span><span>Δ</span></div>
              <div className="attribute-comparison-list">
                {axis.attributes.map((attribute) => {
                  const venueValue = profile.venueMix[attribute.code]
                  const catchmentValue = profile.catchmentMix[attribute.code]
                  const delta = venueValue - catchmentValue
                  return (
                    <div className="attribute-comparison-row" key={attribute.code}>
                      <span className="attribute-name"><small>{attribute.code}</small><strong>{attribute.label}</strong></span>
                      <span className={`attribute-bar venue ${attribute.code === profile.currentDominant ? 'dominant' : ''}`}><i style={{ width: `${venueValue}%` }} /><b>{venueValue}%</b></span>
                      <span className={`attribute-bar catchment ${attribute.code === profile.targetDominant ? 'dominant' : ''}`}><i style={{ width: `${catchmentValue}%` }} /><b>{catchmentValue}%</b></span>
                      <strong className={delta >= 0 ? 'delta-positive' : 'delta-negative'}>{delta > 0 ? '+' : ''}{delta}</strong>
                    </div>
                  )
                })}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
