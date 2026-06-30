import { ChevronDown, Clock3, Layers3, MapPin, Play, Target } from 'lucide-react'
import { axisDefinitions, dayparts, regionsByState } from '../../data/schema'
import type { Daypart, GapPriority, MapLayers, MapMetric } from '../../types/domain'

interface MapSidebarProps {
  selectedRegions: string[]
  onRegionsChange: (regions: string[]) => void
  daypart: Daypart
  onDaypartChange: (daypart: Daypart) => void
  focusMetric: MapMetric
  onFocusMetricChange: (metric: MapMetric) => void
  priority: GapPriority
  onPriorityChange: (priority: GapPriority) => void
  layers: MapLayers
  onLayersChange: (layers: MapLayers) => void
}

export function MapSidebar(props: MapSidebarProps) {
  const allRegions = Object.values(regionsByState).flat()

  const toggleRegion = (region: string) => {
    props.onRegionsChange(
      props.selectedRegions.includes(region)
        ? props.selectedRegions.filter((item) => item !== region)
        : [...props.selectedRegions, region],
    )
  }

  return (
    <aside className="command-deck map-command-deck">
      <div className="deck-intro">
        <span className="eyebrow">Spatial discovery</span>
        <h2>Map controls</h2>
        <p>Locate high-value gaps and inspect local market friction.</p>
      </div>

      <section className="control-module">
        <div className="module-heading">
          <span className="module-number">01</span><MapPin size={17} />
          <div><h3>Geographic scope</h3><p>{props.selectedRegions.length} of {allRegions.length} regions</p></div>
        </div>
        <details className="multi-select">
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
          <div><h3>Temporal daypart</h3><p>Supply changes; catchment stays constant</p></div>
        </div>
        <label className="select-label">
          <span>Active model slice</span>
          <select value={props.daypart} onChange={(event) => props.onDaypartChange(event.target.value as Daypart)}>
            {dayparts.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <div className="model-signal"><Play fill="currentColor" size={12} /> Marker scores update instantly</div>
      </section>

      <section className="control-module">
        <div className="module-heading">
          <span className="module-number">03</span><Target size={17} />
          <div><h3>Opportunity lens</h3><p>Colour markers by model variance</p></div>
        </div>
        <label className="select-label">
          <span>Gap score shown on map</span>
          <select value={props.focusMetric} onChange={(event) => props.onFocusMetricChange(event.target.value as MapMetric)}>
            <option value="overall">Overall Macro Gap</option>
            {axisDefinitions.map((axis) => <option key={axis.key} value={axis.key}>{axis.prompt} - {axis.label.replace(/^Axis \d+: /, '')}</option>)}
          </select>
        </label>
        <label className="select-label map-priority-select">
          <span>Priority band</span>
          <select value={props.priority} onChange={(event) => props.onPriorityChange(event.target.value as GapPriority)}>
            <option value="all">All opportunity levels</option>
            <option value="high">High gap (65-100)</option>
            <option value="medium">Moderate gap (38-64)</option>
            <option value="low">Low gap (0-37)</option>
          </select>
        </label>
      </section>

      <section className="control-module">
        <div className="module-heading">
          <span className="module-number">04</span><Layers3 size={17} />
          <div><h3>Map overlays</h3><p>Context for the selected venue</p></div>
        </div>
        <div className="map-layer-list">
          <label>
            <span><strong>Catchment radius</strong><small>5 km demand area</small></span>
            <input checked={props.layers.catchmentRadius} onChange={(event) => props.onLayersChange({ ...props.layers, catchmentRadius: event.target.checked })} type="checkbox" />
          </label>
          <label>
            <span><strong>Competitor pressure</strong><small>Current direct + indirect set</small></span>
            <input checked={props.layers.competitorPressure} onChange={(event) => props.onLayersChange({ ...props.layers, competitorPressure: event.target.checked })} type="checkbox" />
          </label>
        </div>
      </section>
    </aside>
  )
}
