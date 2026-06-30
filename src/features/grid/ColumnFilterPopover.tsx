import { useEffect, useMemo, useRef, useState } from 'react'
import type { Column } from '@tanstack/react-table'
import { Check, Filter, Search, X } from 'lucide-react'
import type { ColumnFilterValue, VenueRecord } from '../../types/domain'

export function ColumnFilterPopover({ column }: { column: Column<VenueRecord, unknown> }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const filter = (column.getFilterValue() as ColumnFilterValue | undefined) ?? {}
  const variant = column.columnDef.meta?.filterVariant ?? 'text'
  const uniqueValues = useMemo(
    () => [...column.getFacetedUniqueValues().keys()].map(String).sort((a, b) => a.localeCompare(b)).slice(0, 12),
    [column],
  )

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const setFilter = (patch: Partial<ColumnFilterValue>) => {
    const next = { ...filter, ...patch }
    const hasValue = Boolean(next.query || next.selected?.length || next.min !== undefined || next.max !== undefined)
    column.setFilterValue(hasValue ? next : undefined)
  }

  return (
    <div className="column-filter" ref={rootRef}>
      <button
        aria-label={`Filter ${String(column.columnDef.header)}`}
        className={column.getIsFiltered() ? 'filter-trigger active' : 'filter-trigger'}
        onClick={(event) => { event.stopPropagation(); setOpen((value) => !value) }}
        type="button"
      >
        <Filter size={12} fill={column.getIsFiltered() ? 'currentColor' : 'none'} />
      </button>
      {open && (
        <div className="filter-popover" onClick={(event) => event.stopPropagation()}>
          <div className="filter-popover-title"><span>Filter column</span><button onClick={() => setOpen(false)} type="button"><X size={14} /></button></div>
          {variant === 'number' ? (
            <div className="range-inputs">
              <label><span>Minimum</span><input onChange={(event) => setFilter({ min: event.target.value ? Number(event.target.value) : undefined })} placeholder="No min" type="number" value={filter.min ?? ''} /></label>
              <label><span>Maximum</span><input onChange={(event) => setFilter({ max: event.target.value ? Number(event.target.value) : undefined })} placeholder="No max" type="number" value={filter.max ?? ''} /></label>
            </div>
          ) : (
            <>
              <label className="filter-search"><Search size={14} /><input autoFocus onChange={(event) => setFilter({ query: event.target.value })} placeholder="Search values…" value={filter.query ?? ''} /></label>
              <div className="unique-values">
                {uniqueValues.map((value) => {
                  const checked = filter.selected?.includes(value) ?? false
                  return <label key={value}><input checked={checked} onChange={() => setFilter({ selected: checked ? filter.selected?.filter((item) => item !== value) : [...(filter.selected ?? []), value] })} type="checkbox" /><span className="fake-check">{checked && <Check size={11} />}</span><span title={value}>{value}</span></label>
                })}
              </div>
            </>
          )}
          <button className="clear-filter" disabled={!column.getIsFiltered()} onClick={() => column.setFilterValue(undefined)} type="button">Clear filter</button>
        </div>
      )}
    </div>
  )
}

