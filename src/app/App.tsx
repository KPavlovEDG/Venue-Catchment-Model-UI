import { functionalUpdate, type RowSelectionState, type Updater } from '@tanstack/react-table'
import { useEffect, useMemo, useState } from 'react'
import { GlobalHeader } from '../components/GlobalHeader'
import { Sidebar } from '../components/Sidebar'
import { generateVenues } from '../data/generateVenues'
import { metricGroups, regionsByState } from '../data/schema'
import { VenueGrid } from '../features/grid/VenueGrid'
import { VenueProfileDrawer } from '../features/venue-profile/VenueProfileDrawer'
import type { Daypart, MetricGroupId, SavedCohort, VenueRecord } from '../types/domain'

const storageKey = 'venue-catchment-cohorts-v1'

function initialCohorts(): SavedCohort[] {
  try {
    return JSON.parse(localStorage.getItem(storageKey) ?? '[]') as SavedCohort[]
  } catch {
    return []
  }
}

export function App() {
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

  const allVenues = useMemo(() => generateVenues(daypart), [daypart])
  const venues = useMemo(
    () => allVenues.filter((venue) => selectedRegions.includes(venue.region)),
    [allVenues, selectedRegions],
  )

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(cohorts))
  }, [cohorts])

  const updateSelection = (updater: Updater<RowSelectionState>) => {
    setRowSelection((current) => functionalUpdate(updater, current))
  }

  const toggleMetricGroup = (id: MetricGroupId) => {
    if (id === 'basic') return
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
        isRecalculating={isRecalculating}
        lastSynced={lastSynced}
        onExport={() => setExportRequest((value) => value + 1)}
        onRecalculate={recalculate}
      />
      <div className="workspace">
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
          onRegionsChange={setSelectedRegions}
          onSaveCohort={saveCohort}
          selectedRegions={selectedRegions}
          selectedVenueCount={Object.values(rowSelection).filter(Boolean).length}
        />
        <main className="main-content">
          <VenueGrid
            activeMetricGroups={activeMetricGroups}
            data={venues}
            exportRequest={exportRequest}
            onRowSelectionChange={updateSelection}
            onVenueSelect={setSelectedVenue}
            rowSelection={rowSelection}
          />
        </main>
      </div>
      {selectedVenue && <VenueProfileDrawer onClose={() => setSelectedVenue(null)} venue={selectedVenue} />}
    </div>
  )
}
