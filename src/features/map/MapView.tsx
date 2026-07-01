import { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { axisDefinitions } from '../../data/schema'
import type { GapPriority, MapLayers, MapMetric, VenueRecord } from '../../types/domain'
import { exportVenuesToCsv } from '../../utils/exportCsv'

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
  const catchmentLayerRef = useRef<L.LayerGroup | null>(null)
  const competitorLayerRef = useRef<L.LayerGroup | null>(null)
  const onVenueSelectRef = useRef(onVenueSelect)

  const visibleVenues = useMemo(
    () => data.filter((venue) => matchesPriority(scoreFor(venue, focusMetric), priority)),
    [data, focusMetric, priority],
  )
  const exportRowsRef = useRef(visibleVenues)
  const lastExportRequestRef = useRef(exportRequest)
  const selectedVenueId = selectedVenue?.id
  const selectedVenueLatitude = selectedVenue?.latitude
  const selectedVenueLongitude = selectedVenue?.longitude

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
    catchmentLayerRef.current = L.layerGroup().addTo(map)
    competitorLayerRef.current = L.layerGroup().addTo(map)
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
    if (!map || !markers) return

    markers.clearLayers()

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
    })
  }, [focusMetric, selectedVenue?.id, visibleVenues])

  useEffect(() => {
    const catchments = catchmentLayerRef.current
    if (!catchments) return
    catchments.clearLayers()
    if (!layers.catchmentRadius) return
    visibleVenues.forEach((venue) => {
      const selected = venue.id === selectedVenue?.id
      L.circle([venue.latitude, venue.longitude], {
          className: `venue-catchment-circle${selected ? ' selected' : ''}`,
          color: '#356088',
          dashArray: '7 7',
          fillColor: '#80bbe5',
          fillOpacity: selected ? 0.12 : 0.045,
          radius: 1000,
          weight: selected ? 2 : 1,
        })
        .bindTooltip(`${venue.name} · 1 km catchment`, { direction: 'top' })
        .addTo(catchments)
    })
  }, [layers.catchmentRadius, selectedVenue?.id, visibleVenues])

  useEffect(() => {
    const competitors = competitorLayerRef.current
    if (!competitors) return
    competitors.clearLayers()
    if (!layers.competitors || !selectedVenue) return
    selectedVenue.recommendation.currentCompetitors.forEach((competitor) => {
      const direct = competitor.type === 'direct'
      const overlaps = competitor.overlappingAttributes.map((attribute) => attribute.label).join(', ')
      L.circleMarker([competitor.latitude, competitor.longitude], {
        bubblingMouseEvents: false,
        className: `competitor-map-marker ${competitor.type}`,
        color: direct ? '#b44d39' : '#8a6b24',
        fillColor: direct ? '#d56852' : '#d1a63d',
        fillOpacity: 0.92,
        radius: direct ? 7 : 5.5,
        weight: 2,
      })
        .bindTooltip(`${competitor.name} · ${competitor.type}<br>${competitor.address}<br>Overlap: ${overlaps}`, { direction: 'top' })
        .addTo(competitors)
    })
  }, [layers.competitors, selectedVenue])

  useEffect(() => {
    const map = mapRef.current
    if (!map || visibleVenues.length === 0) return
    const bounds = L.latLngBounds(visibleVenues.map((venue) => [venue.latitude, venue.longitude]))
    map.fitBounds(bounds, { padding: [54, 54], maxZoom: 10 })
  }, [visibleVenues])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedVenueId || selectedVenueLatitude === undefined || selectedVenueLongitude === undefined || !visibleVenues.some((venue) => venue.id === selectedVenueId)) return
    map.flyTo([selectedVenueLatitude, selectedVenueLongitude], Math.max(map.getZoom(), 12), { duration: 0.55 })
  }, [selectedVenueId, selectedVenueLatitude, selectedVenueLongitude, visibleVenues])

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
          {layers.catchmentRadius && <span><i className="catchment" />1 km catchment</span>}
          {layers.competitors && <><span><i className="direct-competitor" />Direct</span><span><i className="indirect-competitor" />Indirect</span></>}
        </div>
        {visibleVenues.length === 0 && <div className="map-empty"><strong>No venues in this opportunity band</strong><span>Change the priority band or geographic scope.</span></div>}
      </div>
    </section>
  )
}
