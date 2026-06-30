import { useEffect, useMemo, useRef, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  type ColumnFiltersState,
  type RowSelectionState,
  type SortingState,
  type Updater,
  useReactTable,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, Search, SlidersHorizontal, X } from 'lucide-react'
import { buildColumns } from './columnDefinitions'
import { ColumnFilterPopover } from './ColumnFilterPopover'
import type { MetricGroupId, VenueRecord } from '../../types/domain'
import { exportVenuesToCsv } from '../../utils/exportCsv'

interface VenueGridProps {
  data: VenueRecord[]
  activeMetricGroups: Set<MetricGroupId>
  rowSelection: RowSelectionState
  onRowSelectionChange: (updater: Updater<RowSelectionState>) => void
  onVenueSelect: (venue: VenueRecord) => void
  exportRequest: number
}

function gapLevel(value: number) {
  return value >= 65 ? 'high' : value >= 38 ? 'medium' : 'low'
}

function AxisGap({ value }: { value: number }) {
  return (
    <span className={`axis-gap gap-${gapLevel(value)}`}>
      <strong>{value}</strong>
      <span className="axis-gap-track"><i style={{ width: `${value}%` }} /></span>
    </span>
  )
}

function RecommendationAttributes({ venue, target }: { venue: VenueRecord; target: boolean }) {
  return (
    <span className={`recommendation-attributes ${target ? 'target' : 'current'}`}>
      {venue.recommendation.changes.map((change) => (
        <span className="attribute-chip" key={change.axis}>
          <small>{change.axisLabel}</small>
          <strong>[{target ? change.toCode : change.fromCode}] {target ? change.toLabel : change.fromLabel}</strong>
        </span>
      ))}
    </span>
  )
}

function CompetitionCell({ venue, target }: { venue: VenueRecord; target: boolean }) {
  const counts = target ? venue.recommendation.recommendedCompetition : venue.recommendation.currentCompetition
  return (
    <span className="competition-cell">
      <span><strong>{counts.direct}</strong><small>direct</small></span>
      <span><strong>{counts.indirect}</strong><small>indirect</small></span>
    </span>
  )
}

export function VenueGrid({ data, activeMetricGroups, rowSelection, onRowSelectionChange, onVenueSelect, exportRequest }: VenueGridProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'macroGap', desc: true }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const columns = useMemo(() => buildColumns(activeMetricGroups), [activeMetricGroups])
  // TanStack Table deliberately exposes non-memoizable callbacks; this component does not pass them to memoized children.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, globalFilter, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange,
    getRowId: (row) => row.id,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  const exportRowsRef = useRef<VenueRecord[]>([])
  exportRowsRef.current = table.getFilteredRowModel().rows.map((row) => row.original)

  useEffect(() => {
    if (exportRequest > 0) exportVenuesToCsv(exportRowsRef.current)
  }, [exportRequest])

  const filteredCount = table.getFilteredRowModel().rows.length

  return (
    <section className="grid-panel">
      <div className="grid-toolbar">
        <div>
          <span className="eyebrow">Operational cohort workspace</span>
          <h1>Performance Gap Analysis</h1>
          <p><strong>{filteredCount}</strong> of {data.length} venues · sorted by opportunity</p>
        </div>
        <div className="grid-toolbar-controls">
          {columnFilters.length > 0 && <button className="clear-all" onClick={() => setColumnFilters([])} type="button"><X size={14} /> Clear {columnFilters.length} column filters</button>}
          <label className="global-search"><Search size={16} /><input onChange={(event) => setGlobalFilter(event.target.value)} placeholder="Search all venue data" value={globalFilter} />{globalFilter && <button onClick={() => setGlobalFilter('')} type="button"><X size={13} /></button>}</label>
          <span className="active-columns"><SlidersHorizontal size={14} /> {table.getVisibleLeafColumns().length} columns</span>
        </div>
      </div>

      <div className="table-shell">
        <table className="venue-grid" style={{ width: table.getTotalSize() }}>
          <colgroup>
            {table.getVisibleLeafColumns().map((column) => <col key={column.id} style={{ width: column.getSize() }} />)}
          </colgroup>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr className={`header-level header-level-${headerGroup.depth + 1}`} key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta
                  const isLeaf = header.subHeaders.length === 0
                  return (
                    <th
                      className={`${meta?.tone ? `tone-${meta.tone}` : ''} ${meta?.sticky ? `sticky-${header.column.id}` : ''}`}
                      colSpan={header.colSpan}
                      key={header.id}
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder ? null : isLeaf ? (
                        <div className="leaf-header">
                          {header.column.getCanSort() ? (
                            <button className="sort-trigger" onClick={header.column.getToggleSortingHandler()} type="button">
                              <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                              {header.column.getIsSorted() === 'asc' ? <ArrowUp size={12} /> : header.column.getIsSorted() === 'desc' ? <ArrowDown size={12} /> : <ArrowUpDown className="sort-idle" size={12} />}
                            </button>
                          ) : (
                            <div className="sort-trigger static"><span>{flexRender(header.column.columnDef.header, header.getContext())}</span></div>
                          )}
                          {header.column.getCanFilter() && <ColumnFilterPopover column={header.column} />}
                        </div>
                      ) : <span className="group-header-label">{flexRender(header.column.columnDef.header, header.getContext())}</span>}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr className={row.getIsSelected() ? 'selected' : ''} key={row.id} onClick={() => onVenueSelect(row.original)}>
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta
                  const value = cell.getValue()
                  return (
                    <td className={`${meta?.align ? `align-${meta.align}` : ''} ${meta?.tone ? `tone-${meta.tone}` : ''} ${meta?.sticky ? `sticky-${cell.column.id}` : ''}`} key={cell.id} style={{ width: cell.column.getSize() }}>
                      {cell.column.id === 'macroGap' ? <span className={`gap-badge gap-${gapLevel(Number(value))}`}>{String(value)}</span>
                        : cell.column.id.startsWith('gap-') ? <AxisGap value={Number(value)} />
                        : cell.column.id === 'recommendationFrom' ? <RecommendationAttributes venue={row.original} target={false} />
                        : cell.column.id === 'recommendationTo' ? <RecommendationAttributes venue={row.original} target />
                        : cell.column.id === 'fromDynamics' ? <CompetitionCell venue={row.original} target={false} />
                        : cell.column.id === 'toDynamics' ? <CompetitionCell venue={row.original} target />
                        : cell.column.id === 'recommendedAction' ? <span className="recommendation-summary">{String(value)}</span>
                        : flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {filteredCount === 0 && <div className="empty-grid"><Search size={24} /><h3>No venues match these filters</h3><p>Clear one or more column or geography filters.</p></div>}
      </div>
    </section>
  )
}
