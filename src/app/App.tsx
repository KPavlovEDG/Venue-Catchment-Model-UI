import { functionalUpdate, type RowSelectionState, type Updater } from '@tanstack/react-table'
import { useEffect, useMemo, useState } from 'react'
import { GlobalHeader } from '../components/GlobalHeader'
import { Sidebar } from '../components/Sidebar'
import { generateVenues } from '../data/generateVenues'
import { metricGroups, regionsByState } from '../data/schema'
import { VenueGrid } from '../features/grid/VenueGrid'
import { MapSidebar } from '../features/map/MapSidebar'
import { MapView } from '../features/map/MapView'
import { VenueProfileDrawer } from '../features/venue-profile/VenueProfileDrawer'
import type { AxisKey, DashboardView, Daypart, GapPriority, MapLayers, MapMetric, MetricGroupId, SavedCohort, VenueComment, VenueRecord } from '../types/domain'

const storageKey = 'venue-catchment-cohorts-v1'
const commentStorageKey = 'venue-catchment-comments-v1'

function initialCohorts(): SavedCohort[] {
  try {
    return JSON.parse(localStorage.getItem(storageKey) ?? '[]') as SavedCohort[]
  } catch {
    return []
  }
}

function initialComments(): Record<string, VenueComment> {
  try {
    return JSON.parse(localStorage.getItem(commentStorageKey) ?? '{}') as Record<string, VenueComment>
  } catch {
    return {}
  }
}

export function App() {
  const [activeView, setActiveView] = useState<DashboardView>('grid')
  const [daypart, setDaypart] = useState<Daypart>('Weekly Aggregated')
  const [selectedRegions, setSelectedRegions] = useState<string[]>(Object.values(regionsByState).flat())
  const [activeMetricGroups, setActiveMetricGroups] = useState<Set<MetricGroupId>>(
    () => new Set(metricGroups.filter((group) => group.defaultVisible).map((group) => group.id)),
  )
  const [selectedVenue, setSelectedVenue] = useState<VenueRecord | null>(null)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [cohorts, setCohorts] = useState<SavedCohort[]>(initialCohorts)
  const [cohortName, setCohortName] = useState('')
  const [exportRequest, setExportRequest] = useState(0)
  const [isRecalculating, setIsRecalculating] = useState(false)
  const [lastSynced, setLastSynced] = useState('Today, 09:00 AM')
  const [mapMetric, setMapMetric] = useState<MapMetric>('overall')
  const [mapPriority, setMapPriority] = useState<GapPriority>('all')
  const [mapLayers, setMapLayers] = useState<MapLayers>({ catchmentRadius: true, competitorPressure: true })
  const [comments, setComments] = useState<Record<string, VenueComment>>(initialComments)
  const [underlyingAxes, setUnderlyingAxes] = useState<Set<AxisKey>>(() => new Set())

  const allVenues = useMemo(() => generateVenues(daypart), [daypart])
  const venues = useMemo(
    () => allVenues
      .filter((venue) => selectedRegions.includes(venue.region))
      .map((venue) => ({ ...venue, operatorComment: comments[venue.id] ?? venue.operatorComment })),
    [allVenues, comments, selectedRegions],
  )

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(cohorts))
  }, [cohorts])

  useEffect(() => {
    localStorage.setItem(commentStorageKey, JSON.stringify(comments))
  }, [comments])

  const updateSelection = (updater: Updater<RowSelectionState>) => {
    setRowSelection((current) => functionalUpdate(updater, current))
  }

  const toggleMetricGroup = (id: MetricGroupId) => {
    setActiveMetricGroups((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const saveCohort = () => {
    const venueIds = Object.entries(rowSelection).filter(([, selected]) => selected).map(([id]) => id)
    if (!cohortName.trim() || venueIds.length === 0) return
    setCohorts((current) => [{ id: crypto.randomUUID(), name: cohortName.trim(), venueIds, createdAt: new Date().toISOString() }, ...current])
    setCohortName('')
  }

  const loadCohort = (cohort: SavedCohort) => {
    setRowSelection(Object.fromEntries(cohort.venueIds.map((id) => [id, true])))
  }

  const recalculate = () => {
    setIsRecalculating(true)
    window.setTimeout(() => {
      setIsRecalculating(false)
      setLastSynced(`Today, ${new Intl.DateTimeFormat('en-AU', { hour: '2-digit', minute: '2-digit' }).format(new Date())}`)
    }, 1100)
  }

  return (
    <div className="app-shell">
      <GlobalHeader
        activeView={activeView}
        isRecalculating={isRecalculating}
        lastSynced={lastSynced}
        onExport={() => setExportRequest((value) => value + 1)}
        onRecalculate={recalculate}
        onViewChange={(view) => { setActiveView(view); setSelectedVenue(null) }}
      />
      <div className="workspace">
        {activeView === 'grid' ? (
          <Sidebar
            activeMetricGroups={activeMetricGroups}
            cohortName={cohortName}
            cohorts={cohorts}
            daypart={daypart}
            onCohortNameChange={setCohortName}
            onDaypartChange={(next) => { setDaypart(next); setSelectedVenue(null) }}
            onDeleteCohort={(id) => setCohorts((current) => current.filter((cohort) => cohort.id !== id))}
            onLoadCohort={loadCohort}
            onMetricGroupToggle={toggleMetricGroup}
            onUnderlyingAxesChange={setUnderlyingAxes}
            onRegionsChange={setSelectedRegions}
            onSaveCohort={saveCohort}
            selectedRegions={selectedRegions}
            selectedVenueCount={Object.values(rowSelection).filter(Boolean).length}
            underlyingAxes={underlyingAxes}
          />
        ) : (
          <MapSidebar
            daypart={daypart}
            focusMetric={mapMetric}
            layers={mapLayers}
            onDaypartChange={(next) => { setDaypart(next); setSelectedVenue(null) }}
            onFocusMetricChange={(metric) => { setMapMetric(metric); setSelectedVenue(null) }}
            onLayersChange={setMapLayers}
            onPriorityChange={(priority) => { setMapPriority(priority); setSelectedVenue(null) }}
            onRegionsChange={(regions) => { setSelectedRegions(regions); setSelectedVenue(null) }}
            priority={mapPriority}
            selectedRegions={selectedRegions}
          />
        )}
        <main className="main-content">
          {activeView === 'grid' ? (
            <VenueGrid
              activeMetricGroups={activeMetricGroups}
              data={venues}
              exportRequest={exportRequest}
              onRowSelectionChange={updateSelection}
              onVenueSelect={setSelectedVenue}
              rowSelection={rowSelection}
              underlyingAxes={underlyingAxes}
            />
          ) : (
            <MapView
              data={venues}
              exportRequest={exportRequest}
              focusMetric={mapMetric}
              layers={mapLayers}
              onVenueSelect={setSelectedVenue}
              priority={mapPriority}
              selectedVenue={selectedVenue}
            />
          )}
        </main>
      </div>
      {activeView === 'grid' && selectedVenue && (
        <VenueProfileDrawer
          comment={comments[selectedVenue.id] ?? selectedVenue.operatorComment}
          initialDaypart={daypart}
          onClose={() => setSelectedVenue(null)}
          onCommentChange={(comment) => setComments((current) => ({ ...current, [selectedVenue.id]: comment }))}
          venueId={selectedVenue.id}
        />
      )}
    </div>
  )
}
