import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import { axisDefinitions } from '../../data/schema'
import type { AxisKey, ColumnFilterValue, MetricGroupId, VenueRecord } from '../../types/domain'

type Accessor = (venue: VenueRecord) => unknown

const currency = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  notation: 'compact',
  maximumFractionDigits: 1,
})
const integer = new Intl.NumberFormat('en-AU', { maximumFractionDigits: 0 })
const decimal = new Intl.NumberFormat('en-AU', { maximumFractionDigits: 1 })

export const smartFilter: FilterFn<VenueRecord> = (row, columnId, filter: ColumnFilterValue) => {
  const raw = row.getValue(columnId)
  if (typeof raw === 'number') {
    if (filter.min !== undefined && raw < filter.min) return false
    if (filter.max !== undefined && raw > filter.max) return false
    return true
  }
  const value = String(raw ?? '').toLowerCase()
  if (filter.query && !value.includes(filter.query.toLowerCase())) return false
  if (filter.selected?.length && !filter.selected.includes(String(raw))) return false
  return true
}

function leaf(
  id: string,
  header: string,
  accessorFn: Accessor,
  options: {
    variant?: 'text' | 'number' | 'boolean'
    format?: (value: unknown) => string
    width?: number
    sticky?: boolean
    tone?: NonNullable<ColumnDef<VenueRecord>['meta']>['tone']
    relevantAxes?: AxisKey[]
  } = {},
): ColumnDef<VenueRecord> {
  return {
    id,
    header,
    accessorFn,
    size: options.width ?? (options.variant === 'number' ? 118 : 150),
    minSize: 92,
    maxSize: 320,
    filterFn: smartFilter,
    cell: ({ getValue }) => options.format?.(getValue()) ?? String(getValue() ?? '—'),
    meta: {
      filterVariant: options.variant ?? 'text',
      align: options.variant === 'number' ? 'right' : 'left',
      sticky: options.sticky,
      tone: options.tone,
      relevantAxes: options.relevantAxes,
    },
  }
}

function group(
  id: string,
  header: string,
  columns: ColumnDef<VenueRecord>[],
  metricGroup: MetricGroupId,
  tone: NonNullable<ColumnDef<VenueRecord>['meta']>['tone'],
): ColumnDef<VenueRecord> {
  return { id, header, columns, meta: { metricGroup, tone } }
}

const percent = (value: unknown) => `${decimal.format(Number(value))}%`
const score = (value: unknown) => `${Math.round(Number(value))}`
const money = (value: unknown) => currency.format(Number(value))
const count = (value: unknown) => integer.format(Number(value))
const yesNo = (value: unknown) => (value ? 'Yes' : 'No')
const allAxisKeys = axisDefinitions.map((axis) => axis.key)

function identityFacts(): ColumnDef<VenueRecord> {
  return group('identity', 'Venue Identity', [
    group('identity-core', 'Pinned Identity', [
      group('identity-core-venue', 'Venue', [
        {
          id: 'selectRows',
          header: ({ table }) => (
            <input
              aria-label="Select all filtered venues"
              checked={table.getIsAllPageRowsSelected()}
              className="grid-checkbox"
              onChange={table.getToggleAllPageRowsSelectedHandler()}
              type="checkbox"
            />
          ),
          cell: ({ row }) => (
            <input
              aria-label={`Select ${row.original.name}`}
              checked={row.getIsSelected()}
              className="grid-checkbox"
              onChange={row.getToggleSelectedHandler()}
              onClick={(event) => event.stopPropagation()}
              type="checkbox"
            />
          ),
          enableColumnFilter: false,
          enableSorting: false,
          size: 44,
          meta: { align: 'center', sticky: true },
        },
        leaf('venueId', 'Venue ID', (row) => row.id, { width: 108, sticky: true }),
        leaf('venueName', 'Venue Name', (row) => row.name, { width: 218, sticky: true }),
      ], 'identity', 'neutral'),
    ], 'identity', 'neutral'),
  ], 'identity', 'neutral')
}

function basicFacts(): ColumnDef<VenueRecord> {
  return group('basic', 'Basic Facts', [
    group('basic-core', 'Core Facts', [
      group('basic-core-venue', 'Venue & Commercial', [
        leaf('address', 'Address', (row) => row.address, { width: 260 }),
        leaf('state', 'State', (row) => row.state, { width: 82 }),
        leaf('region', 'Region', (row) => row.region, { width: 162 }),
        leaf('lga', 'LGA', (row) => row.lga, { width: 150 }),
        leaf('ebit', '12M EBIT', (row) => row.financials.rollingEbit, { variant: 'number', format: money }),
        leaf('ebitdaGrowth', 'EBITDA Growth', (row) => row.financials.ebitdaGrowth, { variant: 'number', format: percent }),
        leaf('roi', 'ROI', (row) => row.financials.roi, { variant: 'number', format: percent }),
        leaf('fundsEmployed', 'Funds Employed', (row) => row.financials.fundsEmployed, { variant: 'number', format: money }),
        leaf('tradingDensity', 'Trading Density', (row) => row.financials.tradingDensity, { variant: 'number', format: (value) => `$${count(value)}/m²` }),
        leaf('coordinates', 'Coordinates', (row) => `${row.latitude.toFixed(3)}, ${row.longitude.toFixed(3)}`, { width: 168 }),
      ], 'basic', 'neutral'),
      group('basic-core-catchment', 'Catchment', [
        leaf('population', 'Total Population', (row) => row.catchment.totalPopulation, { variant: 'number', format: count }),
        leaf('populationGrowth', 'Population Growth', (row) => row.catchment.populationGrowth, { variant: 'number', format: percent }),
      ], 'basic', 'neutral'),
    ], 'basic', 'neutral'),
  ], 'basic', 'neutral')
}

function profiles(): ColumnDef<VenueRecord> {
  return group('profiles', 'Strategic Profiles', axisDefinitions.map((axis) =>
    group(`profile-${axis.key}`, axis.label, [
      group(`profile-${axis.key}-general`, 'General', [
        leaf(`profile-${axis.key}-current`, 'Current Dominant', (row) => {
          const code = row.axes[axis.key].currentDominant
          return `[${code}] ${axis.attributes.find((attribute) => attribute.code === code)!.label}`
        }, { width: 240, tone: 'profile' }),
        leaf(`profile-${axis.key}-target`, 'Target Recommended', (row) => {
          const code = row.axes[axis.key].targetDominant
          return `[${code}] ${axis.attributes.find((attribute) => attribute.code === code)!.label}`
        }, { width: 240, tone: 'profile' }),
      ], 'profiles', 'profile'),
    ], 'profiles', 'profile'),
  ), 'profiles', 'profile')
}

function gaps(): ColumnDef<VenueRecord> {
  return group('gaps', 'Results (Gap Scores)', [
    group('gaps-macro', 'Macro Performance', [
      group('gaps-macro-general', 'General', [
        leaf('macroGap', 'Overall Macro Gap', (row) => row.macroGap, { variant: 'number', format: score, width: 150, tone: 'summary' }),
      ], 'gaps', 'summary'),
    ], 'gaps', 'summary'),
    group('gaps-axis', 'Axis-Level Variance', [
      group('gaps-axis-general', 'General', axisDefinitions.map((axis) =>
        leaf(`gap-${axis.key}`, `${axis.label.replace(/^Axis \d+: /, '')} Gap`, (row) => row.axes[axis.key].gap, { variant: 'number', format: score, width: 150, tone: 'gap' }),
      ), 'gaps', 'gap'),
    ], 'gaps', 'gap'),
  ], 'gaps', 'gap')
}

function recommendations(): ColumnDef<VenueRecord> {
  return group('recommendations', 'Recommendations', [
    group('recommendations-actions', 'Recommended Actions', [
      group('recommendations-attribute-shift', 'Attribute Shift', [
        leaf('recommendationShifts', 'Recommended Attribute Shifts', (row) => row.recommendation.changes.map((change) => `[${change.fromCode}] ${change.fromLabel} → [${change.toCode}] ${change.toLabel}`).join(' | '), { width: 390, tone: 'action' }),
      ], 'recommendations', 'action'),
      group('recommendations-market', 'Competitive Set', [
        leaf('fromDynamics', 'Current Competition', (row) => `${row.recommendation.currentCompetition.direct} direct · ${row.recommendation.currentCompetition.indirect} indirect`, { width: 180, tone: 'action' }),
        leaf('toDynamics', 'Recommended Competition', (row) => `${row.recommendation.recommendedCompetition.direct} direct · ${row.recommendation.recommendedCompetition.indirect} indirect`, { width: 190, tone: 'action' }),
      ], 'recommendations', 'action'),
    ], 'recommendations', 'action'),
    group('recommendations-context', 'Human Context', [
      group('recommendations-comments', 'Operator Notes', [
        leaf('commentCurrent', 'Current Positioning Comment', (row) => row.operatorComment.currentPositioning, { width: 260, tone: 'action' }),
        leaf('commentRecommended', 'Recommended Positioning Comment', (row) => row.operatorComment.recommendedPositioning, { width: 260, tone: 'action' }),
        leaf('commentAuthor', 'Comment By', (row) => row.operatorComment.author, { width: 150, tone: 'action' }),
        leaf('commentUpdated', 'Comment Updated', (row) => row.operatorComment.updatedAt ? new Date(row.operatorComment.updatedAt).toLocaleString('en-AU') : '—', { width: 170, tone: 'action' }),
      ], 'recommendations', 'action'),
    ], 'recommendations', 'action'),
  ], 'recommendations', 'action')
}

function competition(): ColumnDef<VenueRecord> {
  const averageAxisMetric = (row: VenueRecord, metric: 'alhShareOfTime' | 'directCompetitorShareOfTime' | 'adjacentCompetitorShareOfTime') =>
    axisDefinitions.reduce((total, axis) => total + row.axes[axis.key][metric], 0) / axisDefinitions.length
  const summary = group('competition-summary', 'Audience & Competitor Summary', [
    leaf('competition-summary-alh-sot', 'ALH Venue SoT', (row) => averageAxisMetric(row, 'alhShareOfTime'), { variant: 'number', format: percent, tone: 'competition' }),
    leaf('competition-summary-direct-sot', 'Direct Competitor SoT', (row) => averageAxisMetric(row, 'directCompetitorShareOfTime'), { variant: 'number', format: percent, tone: 'competition' }),
    leaf('competition-summary-adjacent-sot', 'Adjacent Competitor SoT', (row) => averageAxisMetric(row, 'adjacentCompetitorShareOfTime'), { variant: 'number', format: percent, tone: 'competition' }),
    leaf('competition-summary-direct-count', 'Direct Count', (row) => row.recommendation.currentCompetition.direct, { variant: 'number', format: count, tone: 'competition' }),
    leaf('competition-summary-adjacent-count', 'Adjacent Count', (row) => row.recommendation.currentCompetition.indirect, { variant: 'number', format: count, tone: 'competition' }),
  ], 'competition', 'competition')
  const breakdown = axisDefinitions.map((axis) =>
    group(`competition-${axis.key}`, axis.label, axis.attributes.map((attribute) =>
        group(`competition-${axis.key}-${attribute.code}`, `[${attribute.code}] ${attribute.label}`, [
          leaf(`competition-${axis.key}-${attribute.code}-count`, 'Competitor Count', (row) => row.axes[axis.key].attributeCompetition[attribute.code].competitorCount, { variant: 'number', format: count, tone: 'competition' }),
          leaf(`competition-${axis.key}-${attribute.code}-sot`, 'Share of Time', (row) => row.axes[axis.key].attributeCompetition[attribute.code].competitorShareOfTime, { variant: 'number', format: percent, tone: 'competition' }),
        ], 'competition', 'competition'),
      ), 'competition', 'competition'),
  )
  return group('competition', 'Competitive Overlay', [summary, ...breakdown], 'competition', 'competition')
}

function distributions(): ColumnDef<VenueRecord> {
  return group('distribution', 'Results (%) — Proportional Distribution', axisDefinitions.map((axis) =>
    group(`distribution-${axis.key}`, axis.label, ['venueMix', 'catchmentMix'].map((mixKey) =>
      group(`distribution-${axis.key}-${mixKey}`, mixKey === 'venueMix' ? 'Venue' : 'Catchment', axis.attributes.map((attribute) =>
        leaf(`distribution-${axis.key}-${mixKey}-${attribute.code}`, `[${attribute.code}] ${attribute.label}`, (row) => row.axes[axis.key][mixKey as 'venueMix' | 'catchmentMix'][attribute.code], { variant: 'number', format: percent, tone: 'distribution' }),
      ), 'distribution', 'distribution'),
    ), 'distribution', 'distribution'),
  ), 'distribution', 'distribution')
}

function fieldGroup(
  id: string,
  label: string,
  segment: string,
  fields: ColumnDef<VenueRecord>[],
  defaultAxes: AxisKey[] = allAxisKeys,
) {
  const taggedFields = fields.map((field) => ({
    ...field,
    meta: { ...field.meta, relevantAxes: field.meta?.relevantAxes ?? defaultAxes },
  }))
  return group(id, label, [group(`${id}-segment`, segment, taggedFields, 'underlying', 'underlying')], 'underlying', 'underlying')
}

function underlying(): ColumnDef<VenueRecord> {
  return group('underlying', 'Underlying Metrics', [
    fieldGroup('underlying-assets', 'Asset Capacity Structure', 'Venue', [
      leaf('assetIndoorSeating', 'Indoor Seating', (row) => row.assets.indoorSeating, { variant: 'number', format: count, relevantAxes: ['customer', 'occasion', 'food', 'function'] }),
      leaf('assetOutdoorSeating', 'Outdoor Seating', (row) => row.assets.outdoorSeating, { variant: 'number', format: count, relevantAxes: ['customer', 'occasion', 'food', 'function'] }),
      leaf('assetWinterSeating', 'Winter-Garden Seating', (row) => row.assets.winterGardenSeating, { variant: 'number', format: count, relevantAxes: ['customer', 'occasion', 'food', 'function'] }),
      leaf('assetIndoorArea', 'Indoor Area', (row) => row.assets.indoorArea, { variant: 'number', format: (value) => `${count(value)} m²` }),
      leaf('assetOutdoorArea', 'Outdoor Area', (row) => row.assets.outdoorArea, { variant: 'number', format: (value) => `${count(value)} m²` }),
      leaf('assetWinterArea', 'Winter-Garden Area', (row) => row.assets.winterGardenArea, { variant: 'number', format: (value) => `${count(value)} m²` }),
      leaf('assetEgmCount', 'Total EGM Count', (row) => row.assets.totalEgmCount, { variant: 'number', format: count, relevantAxes: ['gaming'] }),
      leaf('assetPremiumEgm', 'Premium EGM Count', (row) => row.assets.premiumEgmCount, { variant: 'number', format: count, relevantAxes: ['gaming', 'affluence'] }),
      leaf('assetPoolTables', 'Pool Tables', (row) => row.assets.poolTables, { variant: 'number', format: count, relevantAxes: ['occasion', 'beverage'] }),
      leaf('assetDarts', 'Dart Lanes', (row) => row.assets.dartLanes, { variant: 'number', format: count, relevantAxes: ['occasion', 'beverage'] }),
      leaf('assetArcade', 'Arcade Cabinets', (row) => row.assets.arcadeCabinets, { variant: 'number', format: count, relevantAxes: ['customer', 'occasion'] }),
      leaf('assetScreens', 'Screen Count', (row) => row.assets.screenCount, { variant: 'number', format: count, relevantAxes: ['occasion', 'beverage'] }),
      leaf('assetProjectors', 'Projectors', (row) => row.assets.projectors, { variant: 'number', format: count, relevantAxes: ['occasion', 'function'] }),
      leaf('assetLodging', 'Lodging Rooms', (row) => row.assets.lodgingRooms, { variant: 'number', format: count, relevantAxes: ['accommodation'] }),
      leaf('assetFunctionRooms', 'Function Rooms', (row) => row.assets.functionRooms, { variant: 'number', format: count, relevantAxes: ['function'] }),
      leaf('assetFootprint', 'Building Footprint', (row) => row.assets.buildingFootprint, { variant: 'number', format: (value) => `${count(value)} m²` }),
    ]),
    fieldGroup('underlying-operations', 'Operational Services', 'Venue', [
      leaf('opsKitchenTier', 'Kitchen Tier', (row) => row.operations.kitchenTier, { relevantAxes: ['food', 'affluence'] }),
      leaf('opsKitchenType', 'Kitchen Type', (row) => row.operations.kitchenType, { relevantAxes: ['food'] }),
      leaf('opsServiceStyle', 'Service Style', (row) => row.operations.serviceStyle, { relevantAxes: ['food', 'affluence', 'occasion'] }),
      leaf('opsOpenTime', 'Open Time', (row) => row.operations.openTime, { relevantAxes: ['occasion'] }),
      leaf('opsCloseTime', 'Close Time', (row) => row.operations.closeTime, { relevantAxes: ['occasion'] }),
      leaf('opsTradingDays', 'Trading Days', (row) => row.operations.tradingDays, { variant: 'number', format: count, relevantAxes: ['occasion'] }),
      leaf('opsKidsArea', 'Kids Area', (row) => row.operations.kidsArea, { variant: 'boolean', format: yesNo, relevantAxes: ['customer', 'occasion'] }),
      leaf('opsPetFriendly', 'Pet Friendly', (row) => row.operations.petFriendly, { variant: 'boolean', format: yesNo, relevantAxes: ['customer', 'occasion'] }),
      leaf('opsShowsUfc', 'Shows UFC', (row) => row.operations.showsUfc, { variant: 'boolean', format: yesNo, relevantAxes: ['occasion'] }),
      leaf('opsParking', 'On-Site Parking', (row) => row.operations.onSiteParking, { variant: 'boolean', format: yesNo, relevantAxes: ['occasion', 'accommodation', 'function'] }),
      leaf('opsParkingSpaces', 'Parking Spaces', (row) => row.operations.parkingSpaces, { variant: 'number', format: count, relevantAxes: ['occasion', 'accommodation', 'function'] }),
      leaf('opsPaidParking', 'Paid Parking', (row) => row.operations.paidParking, { variant: 'boolean', format: yesNo, relevantAxes: ['occasion', 'affluence'] }),
      leaf('opsRefurbAge', 'Refurbishment Age', (row) => row.operations.refurbishmentAge, { variant: 'number', format: (value) => `${value} yrs` }),
      leaf('opsBarsAge', 'Bars Age', (row) => row.operations.barsAge, { variant: 'number', format: (value) => `${value} yrs`, relevantAxes: ['beverage'] }),
      leaf('opsFoodAge', 'Food Age', (row) => row.operations.foodAge, { variant: 'number', format: (value) => `${value} yrs`, relevantAxes: ['food'] }),
      leaf('opsGamingAge', 'Gaming Age', (row) => row.operations.gamingAge, { variant: 'number', format: (value) => `${value} yrs`, relevantAxes: ['gaming'] }),
      leaf('opsLodgingAge', 'Lodging Age', (row) => row.operations.lodgingAge, { variant: 'number', format: (value) => `${value} yrs`, relevantAxes: ['accommodation'] }),
      leaf('opsTheme', 'Design Theme', (row) => row.operations.designTheme, { relevantAxes: ['affluence', 'occasion', 'food', 'beverage'] }),
      leaf('opsSophistication', 'Sophistication Level', (row) => row.operations.sophisticationLevel, { relevantAxes: ['affluence', 'food', 'beverage'] }),
    ]),
    fieldGroup('underlying-financial', 'Financial Registry', 'Venue', [
      leaf('finEbit', '12M Rolling EBIT', (row) => row.financials.rollingEbit, { variant: 'number', format: money }),
      leaf('finEbitdaGrowth', 'EBITDA Growth', (row) => row.financials.ebitdaGrowth, { variant: 'number', format: percent }),
      leaf('finCagr', '3Yr CAGR', (row) => row.financials.threeYearCagr, { variant: 'number', format: percent }),
      leaf('finRoi', 'ROI', (row) => row.financials.roi, { variant: 'number', format: percent }),
      leaf('finFunds', 'Funds Employed', (row) => row.financials.fundsEmployed, { variant: 'number', format: money }),
      leaf('finDensity', 'Trading Density', (row) => row.financials.tradingDensity, { variant: 'number', format: (value) => `$${count(value)}/m²` }),
      leaf('finRetailEbit', 'Attached Retail EBIT', (row) => row.financials.attachedRetailEbit, { variant: 'number', format: money }),
      leaf('finTransactions', 'Total Transactions', (row) => row.financials.totalTransactions, { variant: 'number', format: count }),
      leaf('finTxGrowth', 'Transactions Growth', (row) => row.financials.transactionsGrowth, { variant: 'number', format: percent }),
      leaf('finFoodSales', 'Food Sales', (row) => row.financials.foodSales, { variant: 'number', format: money }),
      leaf('finBarSales', 'Bar Sales', (row) => row.financials.barSales, { variant: 'number', format: money }),
      leaf('finGamingSales', 'Gaming Sales', (row) => row.financials.gamingSales, { variant: 'number', format: money }),
      leaf('finLodgingSales', 'Lodging Sales', (row) => row.financials.lodgingSales, { variant: 'number', format: money }),
      leaf('finFbMix', 'F&B Mix', (row) => row.financials.fbMix, { variant: 'number', format: percent }),
    ]),
    fieldGroup('underlying-loyalty', 'SVG Customer Loyalty', 'Venue', [
      leaf('loyaltyPenetration', 'Pub+ Penetration', (row) => row.loyalty.penetrationRate, { variant: 'number', format: percent }),
      leaf('loyaltyTier', 'Loyalty Tier Mix', (row) => row.loyalty.loyaltyTierMix),
      leaf('loyaltyAcquisition', 'Acquisition Growth', (row) => row.loyalty.acquisitionGrowth, { variant: 'number', format: percent }),
      leaf('loyaltyPromo', 'Promo Redemption', (row) => row.loyalty.promoRedemptionRate, { variant: 'number', format: percent }),
      leaf('loyaltyFoodSpend', 'Food Spend / Visit', (row) => row.loyalty.foodSpendPerVisit, { variant: 'number', format: money, relevantAxes: ['food', 'affluence'] }),
      leaf('loyaltyBevSpend', 'Bev Spend / Visit', (row) => row.loyalty.beverageSpendPerVisit, { variant: 'number', format: money, relevantAxes: ['beverage', 'affluence'] }),
      leaf('loyaltyGamingSpend', 'Gaming Spend / Visit', (row) => row.loyalty.gamingSpendPerVisit, { variant: 'number', format: money, relevantAxes: ['gaming', 'affluence'] }),
      leaf('loyaltyRecency', 'Visit Recency', (row) => row.loyalty.visitRecencyDays, { variant: 'number', format: (value) => `${value} days` }),
      leaf('loyaltyFrequency', 'Annual Frequency', (row) => row.loyalty.annualFrequency, { variant: 'number', format: (value) => decimal.format(Number(value)) }),
      leaf('loyaltyChurn', 'Churn Rate', (row) => row.loyalty.churnRate, { variant: 'number', format: percent }),
      leaf('loyaltyBookings', 'Bookings Share', (row) => row.loyalty.bookingsShare, { variant: 'number', format: percent, relevantAxes: ['occasion', 'food', 'function'] }),
      leaf('loyaltyConversion', 'Booking Conversion', (row) => row.loyalty.bookingConversion, { variant: 'number', format: percent, relevantAxes: ['occasion', 'food', 'function'] }),
      leaf('loyaltyAgeMix', 'Guest Age Mix', (row) => row.loyalty.guestAgeMix, { relevantAxes: ['customer'] }),
      leaf('loyaltyGenderMix', 'Guest Gender Mix', (row) => row.loyalty.guestGenderMix, { relevantAxes: ['customer'] }),
      leaf('loyaltyFamilyMix', 'Guest Family Mix', (row) => row.loyalty.guestFamilyMix, { relevantAxes: ['customer'] }),
      leaf('loyaltyDistance', 'Home Distance Radius', (row) => row.loyalty.homeDistanceRadius, { variant: 'number', format: (value) => `${decimal.format(Number(value))} km` }),
      leaf('loyaltySessionDwell', 'Session Dwell Time', (row) => row.loyalty.sessionDwellTime, { variant: 'number', format: (value) => `${value} min` }),
      leaf('loyaltyTotalDwell', 'Total Dwell Time', (row) => row.loyalty.totalDwellTime, { variant: 'number', format: (value) => `${value} min` }),
      leaf('loyaltyReview', 'Review Score', (row) => row.loyalty.reviewScore, { variant: 'number', format: (value) => `${decimal.format(Number(value))}/5` }),
    ]),
    fieldGroup('underlying-geo', 'Geospatial Context', 'Catchment', [
      leaf('geoPopulation', 'Total Population', (row) => row.catchment.totalPopulation, { variant: 'number', format: count, relevantAxes: ['customer'] }),
      leaf('geoPopulationGrowth', 'Population Growth', (row) => row.catchment.populationGrowth, { variant: 'number', format: percent, relevantAxes: ['customer'] }),
      leaf('geoRetail', 'Retail Proximity', (row) => row.catchment.retailCount, { variant: 'number', format: count, relevantAxes: ['occasion', 'food', 'beverage'] }),
      leaf('geoUniversities', 'Universities', (row) => row.catchment.universityCount, { variant: 'number', format: count, relevantAxes: ['customer', 'occasion'] }),
      leaf('geoOffices', 'Office Buildings', (row) => row.catchment.officeCount, { variant: 'number', format: count, relevantAxes: ['customer', 'occasion', 'function'] }),
      leaf('geoTransit', 'Transit Hubs', (row) => row.catchment.transitHubCount, { variant: 'number', format: count, relevantAxes: ['customer', 'occasion', 'accommodation'] }),
      leaf('geoStadiums', 'Stadiums', (row) => row.catchment.stadiumCount, { variant: 'number', format: count, relevantAxes: ['occasion', 'function'] }),
      leaf('geoBws', 'BWS Count', (row) => row.catchment.bwsCount, { variant: 'number', format: count, relevantAxes: ['beverage', 'affluence'] }),
      leaf('geoDans', "Dan Murphy's Count", (row) => row.catchment.danMurphysCount, { variant: 'number', format: count, relevantAxes: ['beverage', 'affluence'] }),
    ]),
  ], 'underlying', 'underlying')
}

function filterUnderlyingByAxes(column: ColumnDef<VenueRecord>, selectedAxes: Set<AxisKey>): ColumnDef<VenueRecord> | null {
  if (!('columns' in column) || !column.columns) {
    const relevantAxes = column.meta?.relevantAxes ?? []
    return relevantAxes.some((axis) => selectedAxes.has(axis)) ? column : null
  }
  const columns = column.columns
    .map((child) => filterUnderlyingByAxes(child, selectedAxes))
    .filter((child): child is ColumnDef<VenueRecord> => child !== null)
  return columns.length ? { ...column, columns } : null
}

export function buildColumns(activeGroups: Set<MetricGroupId>, underlyingAxes: Set<AxisKey> = new Set()) {
  const groups = [identityFacts(), basicFacts(), profiles(), gaps(), recommendations(), competition(), distributions(), underlying()]
    .filter((column) => column.id === 'identity' || activeGroups.has(column.id as MetricGroupId))
  if (underlyingAxes.size === 0) return groups
  return groups.flatMap((column) => {
    if (column.id !== 'underlying') return [column]
    const filtered = filterUnderlyingByAxes(column, underlyingAxes)
    return filtered ? [filtered] : []
  })
}
