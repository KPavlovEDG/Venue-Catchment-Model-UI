import { axisDefinitions } from '../../data/schema'
import type { AxisKey, VenueRecord } from '../../types/domain'

interface RadarChartProps {
  venue: VenueRecord
  selectedAxes: Set<AxisKey>
  onAxisToggle: (axis: AxisKey) => void
}

const center = { x: 260, y: 160 }
const radius = 110

const radarLabels: Record<AxisKey, string[]> = {
  customer: ['Customer Profile'],
  affluence: ['Affluence &', 'Pricing Alignment'],
  occasion: ['Occasion'],
  food: ['Food Concept'],
  beverage: ['Beverage Concept'],
  gaming: ['Gaming Profile'],
  accommodation: ['Accommodation', 'Profile'],
  function: ['Event & Function', 'Profile'],
}

function point(index: number, value: number) {
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / axisDefinitions.length
  const distance = radius * (value / 100)
  return `${center.x + Math.cos(angle) * distance},${center.y + Math.sin(angle) * distance}`
}

export function RadarChart({ venue, selectedAxes, onAxisToggle }: RadarChartProps) {
  const venueValues = axisDefinitions.map((axis) => Math.max(...Object.values(venue.axes[axis.key].venueMix)))
  const catchmentValues = axisDefinitions.map((axis) => Math.max(...Object.values(venue.axes[axis.key].catchmentMix)))
  const maximumValue = Math.max(...venueValues, ...catchmentValues)
  const scaleMaximum = Math.min(100, Math.max(40, Math.ceil(maximumValue / 10) * 10))
  const scale = (value: number) => (value / scaleMaximum) * 100

  return (
    <div className="radar-wrap">
      <div className="chart-heading"><div><span className="eyebrow">Selected daypart</span><h3>Demand vs supply profile</h3></div><span className="chart-scale">Select axes · 0–{scaleMaximum}% adaptive scale</span></div>
      <svg aria-label="Interactive radar chart comparing venue and catchment profile strength across eight axes" className="radar-chart" role="img" viewBox="0 0 520 340">
        {[25, 50, 75, 100].map((ring) => (
          <polygon className="radar-ring" key={ring} points={axisDefinitions.map((_, index) => point(index, ring)).join(' ')} />
        ))}
        {axisDefinitions.map((axis, index) => {
          const end = point(index, 100).split(',')
          const label = point(index, 128).split(',')
          const selected = selectedAxes.size === 0 || selectedAxes.has(axis.key)
          return (
            <g
              aria-label={`${axis.label.replace(/^Axis \d+: /, '')}${selectedAxes.has(axis.key) ? ', selected' : ''}`}
              aria-pressed={selectedAxes.has(axis.key)}
              className={`radar-axis-control ${selected ? 'selected' : 'dimmed'}`}
              key={axis.key}
              onClick={() => onAxisToggle(axis.key)}
              onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onAxisToggle(axis.key) }}
              role="button"
              tabIndex={0}
            >
              <line className="radar-axis" x1={center.x} x2={end[0]} y1={center.y} y2={end[1]} />
              <circle className="radar-axis-hit" cx={label[0]} cy={label[1]} r="22" />
              <text className="radar-label" textAnchor={Number(label[0]) < center.x - 5 ? 'end' : Number(label[0]) > center.x + 5 ? 'start' : 'middle'} x={label[0]} y={Number(label[1]) - (radarLabels[axis.key].length - 1) * 5}>
                {radarLabels[axis.key].map((line, lineIndex) => <tspan dy={lineIndex === 0 ? 0 : 11} key={line} x={label[0]}>{line}</tspan>)}
              </text>
            </g>
          )
        })}
        <polygon className="radar-area catchment" points={catchmentValues.map((value, index) => point(index, scale(value))).join(' ')} />
        <polygon className="radar-area venue" points={venueValues.map((value, index) => point(index, scale(value))).join(' ')} />
        {venueValues.map((value, index) => {
          const [x, y] = point(index, scale(value)).split(',')
          return <circle className="radar-point venue" cx={x} cy={y} key={`v-${axisDefinitions[index].key}`} r="4" />
        })}
        {catchmentValues.map((value, index) => {
          const [x, y] = point(index, scale(value)).split(',')
          return <circle className="radar-point catchment" cx={x} cy={y} key={`c-${axisDefinitions[index].key}`} r="4" />
        })}
      </svg>
      <div className="radar-legend"><span><i className="legend-venue" />Venue profile</span><span><i className="legend-catchment" />Catchment profile</span><small>Click axes to filter the deep dive</small></div>
    </div>
  )
}
