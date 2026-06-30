import type { VenueRecord } from '../types/domain'

function escapeCsv(value: unknown) {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function exportVenuesToCsv(venues: VenueRecord[]) {
  const headers = [
    'Venue ID', 'Venue Name', 'State', 'Region', 'LGA', 'Current Cluster',
    'Target Cluster', 'Alignment', 'Macro Gap', 'Recommendation Type', 'Recommended Action',
  ]
  const rows = venues.map((venue) => [
    venue.id, venue.name, venue.state, venue.region, venue.lga, venue.currentCluster,
    venue.targetCluster, venue.alignmentStatus, venue.macroGap,
    venue.recommendation.type, venue.recommendation.action,
  ])
  const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `venue-catchment-export-${new Date().toISOString().slice(0, 10)}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}

