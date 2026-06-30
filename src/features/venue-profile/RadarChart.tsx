import { axisDefinitions } from '../../data/schema'
import type { VenueRecord } from '../../types/domain'

interface RadarChartProps {
  venue: VenueRecord
}

const center = { x: 180, y: 132 }
const radius = 88

function point(index: number, value: number) {
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / axisDefinitions.length
  const distance = radius * (value / 100)
  return `${center.x + Math.cos(angle) * distance},${center.y + Math.sin(angle) * distance}`
}

export function RadarChart({ venue }: RadarChartProps) {
  const venueValues = axisDefinitions.map((axis) => Math.max(...Object.values(venue.axes[axis.key].venueMix)))
  const catchmentValues = axisDefinitions.map((axis) => Math.max(...Object.values(venue.axes[axis.key].catchmentMix)))

  return (
    <div className="radar-wrap">
      <div className="chart-heading"><div><span className="eyebrow">Selected daypart</span><h3>Demand vs supply profile</h3></div><span className="chart-scale">Dominant weight · %</span></div>
      <svg aria-label="Radar chart comparing venue and catchment profile strength across eight axes" className="radar-chart" role="img" viewBox="0 0 360 292">
        {[25, 50, 75, 100].map((ring) => (
          <polygon className="radar-ring" key={ring} points={axisDefinitions.map((_, index) => point(index, ring)).join(' ')} />
        ))}
        {axisDefinitions.map((axis, index) => {
          const end = point(index, 100).split(',')
          const label = point(index, 120).split(',')
          return (
            <g key={axis.key}>
              <line className="radar-axis" x1={center.x} x2={end[0]} y1={center.y} y2={end[1]} />
              <text className="radar-label" textAnchor={Number(label[0]) < center.x - 5 ? 'end' : Number(label[0]) > center.x + 5 ? 'start' : 'middle'} x={label[0]} y={label[1]}>{axis.prompt}</text>
            </g>
          )
        })}
        <polygon className="radar-area catchment" points={catchmentValues.map((value, index) => point(index, value)).join(' ')} />
        <polygon className="radar-area venue" points={venueValues.map((value, index) => point(index, value)).join(' ')} />
        {venueValues.map((value, index) => {
          const [x, y] = point(index, value).split(',')
          return <circle className="radar-point venue" cx={x} cy={y} key={`v-${axisDefinitions[index].key}`} r="3" />
        })}
        {catchmentValues.map((value, index) => {
          const [x, y] = point(index, value).split(',')
          return <circle className="radar-point catchment" cx={x} cy={y} key={`c-${axisDefinitions[index].key}`} r="3" />
        })}
      </svg>
      <div className="radar-legend"><span><i className="legend-venue" />Venue profile</span><span><i className="legend-catchment" />Catchment profile</span></div>
    </div>
  )
}

