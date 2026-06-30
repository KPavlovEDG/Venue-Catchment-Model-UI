import { BookmarkPlus, ChevronDown, Clock3, Columns3, MapPin, Play, Save, Trash2 } from 'lucide-react'
import { dayparts, metricGroups, regionsByState } from '../data/schema'
import type { Daypart, MetricGroupId, SavedCohort } from '../types/domain'

interface SidebarProps {
  selectedRegions: string[]
  onRegionsChange: (regions: string[]) => void
  daypart: Daypart
  onDaypartChange: (daypart: Daypart) => void
  activeMetricGroups: Set<MetricGroupId>
  onMetricGroupToggle: (id: MetricGroupId) => void
  cohorts: SavedCohort[]
  cohortName: string
  onCohortNameChange: (name: string) => void
  selectedVenueCount: number
  onSaveCohort: () => void
  onLoadCohort: (cohort: SavedCohort) => void
  onDeleteCohort: (id: string) => void
}

export function Sidebar(props: SidebarProps) {
  const allRegions = Object.values(regionsByState).flat()

  const toggleRegion = (region: string) => {
    props.onRegionsChange(
      props.selectedRegions.includes(region)
        ? props.selectedRegions.filter((item) => item !== region)
        : [...props.selectedRegions, region],
    )
  }

  return (
    <aside className="command-deck">
      <div className="deck-intro">
        <span className="eyebrow">Workspace controls</span>
        <h2>Command deck</h2>
        <p>Build and compare operational venue cohorts.</p>
      </div>

      <section className="control-module">
        <div className="module-heading">
          <span className="module-number">01</span><MapPin size={17} />
          <div><h3>Geographic scope</h3><p>{props.selectedRegions.length} of {allRegions.length} regions</p></div>
        </div>
        <details className="multi-select" open>
          <summary>Select states & regions <ChevronDown size={15} /></summary>
          <div className="multi-select-menu">
            {Object.entries(regionsByState).map(([state, regions]) => (
              <div className="region-group" key={state}>
                <strong>{state}</strong>
                {regions.map((region) => (
                  <label key={region}>
                    <input checked={props.selectedRegions.includes(region)} onChange={() => toggleRegion(region)} type="checkbox" />
                    <span>{region}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
        </details>
      </section>

      <section className="control-module">
        <div className="module-heading">
          <span className="module-number">02</span><Clock3 size={17} />
          <div><h3>Temporal daypart</h3><p>Model demand window</p></div>
        </div>
        <label className="select-label">
          <span>Active model slice</span>
          <select value={props.daypart} onChange={(event) => props.onDaypartChange(event.target.value as Daypart)}>
            {dayparts.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <div className="model-signal"><Play size={12} fill="currentColor" /> Supply metrics update on selection</div>
      </section>

      <section className="control-module metric-module">
        <div className="module-heading">
          <span className="module-number">03</span><Columns3 size={17} />
          <div><h3>Active metric groups</h3><p>Four-tier column tree</p></div>
        </div>
        <div className="metric-tree">
          {metricGroups.map((group) => (
            <label className={props.activeMetricGroups.has(group.id) ? 'metric-option active' : 'metric-option'} key={group.id}>
              <input
                checked={props.activeMetricGroups.has(group.id)}
                disabled={group.id === 'basic'}
                onChange={() => props.onMetricGroupToggle(group.id)}
                type="checkbox"
              />
              <span className="tree-line" />
              <span><strong>{group.label}</strong><small>{group.description}</small></span>
            </label>
          ))}
        </div>
      </section>

      <section className="control-module cohort-module">
        <div className="module-heading">
          <span className="module-number">04</span><BookmarkPlus size={17} />
          <div><h3>Custom cohorts</h3><p>{props.selectedVenueCount} venues selected</p></div>
        </div>
        <div className="save-cohort">
          <input
            aria-label="Cohort name"
            onChange={(event) => props.onCohortNameChange(event.target.value)}
            placeholder="e.g. FY27 renewals"
            value={props.cohortName}
          />
          <button disabled={!props.cohortName.trim() || props.selectedVenueCount === 0} onClick={props.onSaveCohort} title="Save cohort" type="button">
            <Save size={15} />
          </button>
        </div>
        <div className="cohort-list">
          {props.cohorts.length === 0 ? (
            <p className="empty-cohorts">Select rows to save your first cohort.</p>
          ) : props.cohorts.map((cohort) => (
            <div className="cohort-item" key={cohort.id}>
              <button className="cohort-load" onClick={() => props.onLoadCohort(cohort)} type="button">
                <strong>{cohort.name}</strong><span>{cohort.venueIds.length} venues</span>
              </button>
              <button className="cohort-delete" onClick={() => props.onDeleteCohort(cohort.id)} title={`Delete ${cohort.name}`} type="button"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </section>
    </aside>
  )
}

