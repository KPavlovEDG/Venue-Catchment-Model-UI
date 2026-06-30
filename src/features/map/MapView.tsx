import { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { axisDefinitions } from '../../data/schema'
import type { GapPriority, MapLayers, MapMetric, VenueRecord } from '../../types/domain'
import { exportVenuesToCsv } from '../../utils/exportCsv'
import { MapVenuePanel } from './MapVenuePanel'

interface MapViewProps {
  data: VenueRecord[]
  exportRequest: number
  focusMetric: MapMetric
  layers: MapLayers
  priority: GapPriority
  selectedVenue: VenueRecord | null
  onVenueSelect: (venue: VenueRecord | null) => void
}

function gapLevel(score: number) {
  return score >= 65 ? 'high' : score >= 38 ? 'medium' : 'low'
}

function scoreFor(venue: VenueRecord, metric: MapMetric) {
  return metric === 'overall' ? venue.macroGap : venue.axes[metric].gap
}

function matchesPriority(score: number, priority: GapPriority) {
  if (priority === 'high') return score >= 65
  if (priority === 'medium') return score >= 38 && score < 65
  if (priority === 'low') return score < 38
  return true
}

export function MapView({ data, exportRequest, focusMetric, layers, priority, selectedVenue, onVenueSelect }: MapViewProps) {
  const mapElementRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerLayerRef = useRef<L.LayerGroup | null>(null)
  const pressureLayerRef = useRef<L.LayerGroup | null>(null)
  const selectionLayerRef = useRef<L.LayerGroup | null>(null)
  const onVenueSelectRef = useRef(onVenueSelect)

  const visibleVenues = useMemo(
    () => data.filter((venue) => matchesPriority(scoreFor(venue, focusMetric), priority)),
    [data, focusMetric, priority],
  )
  const exportRowsRef = useRef(visibleVenues)
  const lastExportRequestRef = useRef(exportRequest)

  useEffect(() => {
    onVenueSelectRef.current = onVenueSelect
  }, [onVenueSelect])

  useEffect(() => {
    exportRowsRef.current = visibleVenues
  }, [visibleVenues])

  useEffect(() => {
    if (exportRequest > lastExportRequestRef.current) exportVenuesToCsv(exportRowsRef.current)
    lastExportRequestRef.current = exportRequest
  }, [exportRequest])

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) return
    const map = L.map(mapElementRef.current, { minZoom: 4, zoomControl: false }).setView([-33.4, 146.4], 5)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map)
    markerLayerRef.current = L.layerGroup().addTo(map)
    pressureLayerRef.current = L.layerGroup().addTo(map)
    selectionLayerRef.current = L.layerGroup().addTo(map)
    map.on('click', () => onVenueSelectRef.current(null))
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const markers = markerLayerRef.current
    const pressure = pressureLayerRef.current
    const selection = selectionLayerRef.current
    if (!map || !markers || !pressure || !selection) return

    markers.clearLayers()
    pressure.clearLayers()
    selection.clearLayers()

    visibleVenues.forEach((venue) => {
      const score = scoreFor(venue, focusMetric)
      const level = gapLevel(score)
      const selected = venue.id === selectedVenue?.id
      const marker = L.marker([venue.latitude, venue.longitude], {
        bubblingMouseEvents: false,
        icon: L.divIcon({
          className: 'map-marker-host',
          html: `<div class="map-gap-marker gap-${level}${selected ? ' selected' : ''}"><span>${score}</span></div>`,
          iconAnchor: [18, 18],
          iconSize: [36, 36],
        }),
        keyboard: true,
        title: `${venue.name}: gap ${score}`,
      })
      marker.bindTooltip(`${venue.name} · ${score}`, { direction: 'top', offset: [0, -15] })
      marker.on('click', () => onVenueSelectRef.current(venue))
      marker.addTo(markers)

      if (layers.competitorPressure) {
        const count = venue.recommendation.currentCompetition.direct + venue.recommendation.currentCompetition.indirect
        L.circle([venue.latitude, venue.longitude], {
          className: 'competitor-pressure-circle',
          color: '#6b8fa8',
          fillColor: '#80bbe5',
          fillOpacity: Math.min(0.08 + count * 0.012, 0.24),
          opacity: 0.26,
          radius: 7000 + count * 1800,
          weight: 1,
        }).addTo(pressure)
      }
    })

    if (selectedVenue && visibleVenues.some((venue) => venue.id === selectedVenue.id)) {
      if (layers.catchmentRadius) {
        L.circle([selectedVenue.latitude, selectedVenue.longitude], {
          className: 'selected-catchment-circle',
          color: '#356088',
          dashArray: '7 7',
          fillColor: '#80bbe5',
          fillOpacity: 0.09,
          radius: 5000,
          weight: 2,
        }).addTo(selection)
      }
      map.flyTo([selectedVenue.latitude, selectedVenue.longitude], Math.max(map.getZoom(), 10), { duration: 0.55 })
    } else if (visibleVenues.length > 0) {
      const bounds = L.latLngBounds(visibleVenues.map((venue) => [venue.latitude, venue.longitude]))
      map.fitBounds(bounds, { padding: [54, 54], maxZoom: 10 })
    }
  }, [focusMetric, layers, selectedVenue, visibleVenues])

  const sortedScores = visibleVenues.map((venue) => scoreFor(venue, focusMetric)).sort((left, right) => left - right)
  const medianScore = sortedScores.length ? sortedScores[Math.floor(sortedScores.length / 2)] : 0
  const highPriorityCount = sortedScores.filter((score) => score >= 65).length
  const metricLabel = focusMetric === 'overall'
    ? 'Overall Macro Gap'
    : axisDefinitions.find((axis) => axis.key === focusMetric)!.label.replace(/^Axis \d+: /, '')

  return (
    <section className="map-view">
      <div className="map-summary-bar">
        <div><span className="eyebrow">Spatial opportunity view</span><h1>Venue Gap Map</h1></div>
        <div className="map-kpis">
          <div><span>Visible venues</span><strong>{visibleVenues.length}</strong></div>
          <div><span>High priority</span><strong>{highPriorityCount}</strong></div>
          <div><span>Median score</span><strong>{medianScore}</strong></div>
          <div className="active-lens"><span>Active lens</span><strong>{metricLabel}</strong></div>
        </div>
      </div>

      <div className="map-canvas-shell">
        <div aria-label="Interactive map of venue gap opportunities" className="map-canvas" ref={mapElementRef} role="application" />
        <div className="map-legend" aria-label="Gap score legend">
          <strong>Gap score</strong><span><i className="high" />65-100</span><span><i className="medium" />38-64</span><span><i className="low" />0-37</span>
          {layers.competitorPressure && <small>Halo = competitor pressure</small>}
        </div>
        {visibleVenues.length === 0 && <div className="map-empty"><strong>No venues in this opportunity band</strong><span>Change the priority band or geographic scope.</span></div>}
        {selectedVenue && visibleVenues.some((venue) => venue.id === selectedVenue.id) && (
          <MapVenuePanel focusMetric={focusMetric} onClose={() => onVenueSelect(null)} venue={selectedVenue} />
        )}
      </div>
    </section>
  )
}
