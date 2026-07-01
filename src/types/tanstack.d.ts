import '@tanstack/react-table'
import type { AxisKey, MetricGroupId } from './domain'

declare module '@tanstack/react-table' {
  // Generic parameters are required to match TanStack's declaration-merging contract.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: 'text' | 'number' | 'boolean'
    align?: 'left' | 'right' | 'center'
    tone?: 'neutral' | 'profile' | 'gap' | 'summary' | 'action' | 'competition' | 'distribution' | 'underlying'
    metricGroup?: MetricGroupId
    sticky?: boolean
    relevantAxes?: AxisKey[]
  }
}
