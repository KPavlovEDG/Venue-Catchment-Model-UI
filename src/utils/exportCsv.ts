import type { VenueRecord } from '../types/domain'

function escapeCsv(value: unknown) {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

type FlatRow = Record<string, string | number | boolean>

function flattenRecord(value: unknown, prefix = '', result: FlatRow = {}): FlatRow {
  if (Array.isArray(value)) {
    result[prefix] = JSON.stringify(value)
    return result
  }
  if (value !== null && typeof value === 'object') {
    Object.entries(value).forEach(([key, nestedValue]) => {
      flattenRecord(nestedValue, prefix ? `${prefix}.${key}` : key, result)
    })
    return result
  }
  if (prefix) result[prefix] = value as string | number | boolean
  return result
}

export function exportVenuesToCsv(venues: VenueRecord[]) {
  const flatRows = venues.map((venue) => flattenRecord(venue))
  const headers = [...new Set(flatRows.flatMap((row) => Object.keys(row)))]
  const rows = flatRows.map((row) => headers.map((header) => row[header] ?? ''))
  const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n')
  const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `venue-catchment-export-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
