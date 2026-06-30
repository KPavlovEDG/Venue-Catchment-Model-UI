import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import { axisDefinitions } from '../../data/schema'
import type { ColumnFilterValue, MetricGroupId, VenueRecord } from '../../types/domain'

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

function basicFacts(): ColumnDef<VenueRecord> {
  return group('basic', 'Basic Facts', [
    group('basic-core', 'Core Facts', [
      group('basic-core-venue', 'Venue', [
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
        leaf('venueId', 'Venue ID', (row) => row.id, { width: 108 }),
        leaf('venueName', 'Venue Name', (row) => row.name, { width: 218, sticky: true }),
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
        leaf(`profile-${axis.key}-current`, 'Current Dominant', (row) => row.axes[axis.key].currentDominant, { width: 176, tone: 'profile' }),
        leaf(`profile-${axis.key}-target`, 'Target Recommended', (row) => row.axes[axis.key].targetDominant, { width: 186, tone: 'profile' }),
      ], 'profiles', 'profile'),
    ], 'profiles', 'profile'),
  ), 'profiles', 'profile')
}

function gaps(): ColumnDef<VenueRecord> {
  return group('gaps', 'Results (Gap Scores)', [
    group('gaps-macro', 'Macro Performance', [
      group('gaps-macro-general', 'General', [
        leaf('macroGap', 'Overall Macro Gap', (row) => row.macroGap, { variant: 'number', format: score, width: 142, tone: 'gap' }),
        leaf('alignmentStatus', 'Alignment Flag', (row) => row.alignmentStatus, { width: 132, tone: 'gap' }),
      ], 'gaps', 'gap'),
    ], 'gaps', 'gap'),
    group('gaps-axis', 'Axis-Level Variance', [
      group('gaps-axis-general', 'General', axisDefinitions.map((axis) =>
        leaf(`gap-${axis.key}`, `${axis.prompt} Gap`, (row) => row.axes[axis.key].gap, { variant: 'number', format: score, tone: 'gap' }),
      ), 'gaps', 'gap'),
    ], 'gaps', 'gap'),
  ], 'gaps', 'gap')
}

function recommendations(): ColumnDef<VenueRecord> {
  return group('recommendations', 'Recommendations', [
    group('recommendations-actions', 'Recommended Actions', [
      group('recommendations-general', 'General', [
        leaf('recommendationType', 'Strategy Type', (row) => row.recommendation.type, { width: 126, tone: 'action' }),
        leaf('recommendationFrom', 'From', (row) => row.recommendation.from, { width: 174, tone: 'action' }),
        leaf('recommendationTo', 'To', (row) => row.recommendation.to, { width: 174, tone: 'action' }),
        leaf('fromDynamics', 'Competitive Dynamics — From', (row) => row.recommendation.fromDynamics, { width: 260, tone: 'action' }),
        leaf('toDynamics', 'Competitive Dynamics — To', (row) => row.recommendation.toDynamics, { width: 260, tone: 'action' }),
        leaf('recommendedAction', 'Recommended Action', (row) => row.recommendation.action, { width: 300, tone: 'action' }),
      ], 'recommendations', 'action'),
    ], 'recommendations', 'action'),
  ], 'recommendations', 'action')
}

function competition(): ColumnDef<VenueRecord> {
  return group('competition', 'Competitive Overlay', axisDefinitions.map((axis) =>
    group(`competition-${axis.key}`, axis.label, [
      group(`competition-${axis.key}-general`, 'General', [
        leaf(`competition-${axis.key}-alh-sot`, 'ALH Venue SoT', (row) => row.axes[axis.key].alhShareOfTime, { variant: 'number', format: percent, tone: 'competition' }),
        leaf(`competition-${axis.key}-direct-sot`, 'Direct Competitor SoT', (row) => row.axes[axis.key].directCompetitorShareOfTime, { variant: 'number', format: percent, tone: 'competition' }),
        leaf(`competition-${axis.key}-adjacent-sot`, 'Adjacent Competitor SoT', (row) => row.axes[axis.key].adjacentCompetitorShareOfTime, { variant: 'number', format: percent, tone: 'competition' }),
        leaf(`competition-${axis.key}-direct-count`, 'Direct Count', (row) => row.axes[axis.key].directCompetitorCount, { variant: 'number', format: count, tone: 'competition' }),
        leaf(`competition-${axis.key}-adjacent-count`, 'Adjacent Count', (row) => row.axes[axis.key].adjacentCompetitorCount, { variant: 'number', format: count, tone: 'competition' }),
      ], 'competition', 'competition'),
      ...axis.attributes.map((attribute) =>
        group(`competition-${axis.key}-${attribute.code}`, `[${attribute.code}] ${attribute.label}`, [
          leaf(`competition-${axis.key}-${attribute.code}-count`, 'Competitor Count', (row) => row.axes[axis.key].attributeCompetition[attribute.code].competitorCount, { variant: 'number', format: count, tone: 'competition' }),
          leaf(`competition-${axis.key}-${attribute.code}-sot`, 'Share of Time', (row) => row.axes[axis.key].attributeCompetition[attribute.code].competitorShareOfTime, { variant: 'number', format: percent, tone: 'competition' }),
        ], 'competition', 'competition'),
      ),
    ], 'competition', 'competition'),
  ), 'competition', 'competition')
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
) {
  return group(id, label, [group(`${id}-segment`, segment, fields, 'underlying', 'underlying')], 'underlying', 'underlying')
}

function underlying(): ColumnDef<VenueRecord> {
  return group('underlying', 'Underlying Metrics', [
    fieldGroup('underlying-assets', 'Asset Capacity Structure', 'Venue', [
      leaf('assetIndoorSeating', 'Indoor Seating', (row) => row.assets.indoorSeating, { variant: 'number', format: count }),
      leaf('assetOutdoorSeating', 'Outdoor Seating', (row) => row.assets.outdoorSeating, { variant: 'number', format: count }),
      leaf('assetWinterSeating', 'Winter-Garden Seating', (row) => row.assets.winterGardenSeating, { variant: 'number', format: count }),
      leaf('assetIndoorArea', 'Indoor Area', (row) => row.assets.indoorArea, { variant: 'number', format: (value) => `${count(value)} m²` }),
      leaf('assetOutdoorArea', 'Outdoor Area', (row) => row.assets.outdoorArea, { variant: 'number', format: (value) => `${count(value)} m²` }),
      leaf('assetWinterArea', 'Winter-Garden Area', (row) => row.assets.winterGardenArea, { variant: 'number', format: (value) => `${count(value)} m²` }),
      leaf('assetEgmCount', 'Total EGM Count', (row) => row.assets.totalEgmCount, { variant: 'number', format: count }),
      leaf('assetPremiumEgm', 'Premium EGM Count', (row) => row.assets.premiumEgmCount, { variant: 'number', format: count }),
      leaf('assetPoolTables', 'Pool Tables', (row) => row.assets.poolTables, { variant: 'number', format: count }),
      leaf('assetDarts', 'Dart Lanes', (row) => row.assets.dartLanes, { variant: 'number', format: count }),
      leaf('assetArcade', 'Arcade Cabinets', (row) => row.assets.arcadeCabinets, { variant: 'number', format: count }),
      leaf('assetScreens', 'Screen Count', (row) => row.assets.screenCount, { variant: 'number', format: count }),
      leaf('assetProjectors', 'Projectors', (row) => row.assets.projectors, { variant: 'number', format: count }),
      leaf('assetLodging', 'Lodging Rooms', (row) => row.assets.lodgingRooms, { variant: 'number', format: count }),
      leaf('assetFunctionRooms', 'Function Rooms', (row) => row.assets.functionRooms, { variant: 'number', format: count }),
      leaf('assetFootprint', 'Building Footprint', (row) => row.assets.buildingFootprint, { variant: 'number', format: (value) => `${count(value)} m²` }),
    ]),
    fieldGroup('underlying-operations', 'Operational Services', 'Venue', [
      leaf('opsKitchenTier', 'Kitchen Tier', (row) => row.operations.kitchenTier),
      leaf('opsKitchenType', 'Kitchen Type', (row) => row.operations.kitchenType),
      leaf('opsServiceStyle', 'Service Style', (row) => row.operations.serviceStyle),
      leaf('opsOpenTime', 'Open Time', (row) => row.operations.openTime),
      leaf('opsCloseTime', 'Close Time', (row) => row.operations.closeTime),
      leaf('opsTradingDays', 'Trading Days', (row) => row.operations.tradingDays, { variant: 'number', format: count }),
      leaf('opsKidsArea', 'Kids Area', (row) => row.operations.kidsArea, { variant: 'boolean', format: yesNo }),
      leaf('opsPetFriendly', 'Pet Friendly', (row) => row.operations.petFriendly, { variant: 'boolean', format: yesNo }),
      leaf('opsShowsUfc', 'Shows UFC', (row) => row.operations.showsUfc, { variant: 'boolean', format: yesNo }),
      leaf('opsParking', 'On-Site Parking', (row) => row.operations.onSiteParking, { variant: 'boolean', format: yesNo }),
      leaf('opsParkingSpaces', 'Parking Spaces', (row) => row.operations.parkingSpaces, { variant: 'number', format: count }),
      leaf('opsPaidParking', 'Paid Parking', (row) => row.operations.paidParking, { variant: 'boolean', format: yesNo }),
      leaf('opsRefurbAge', 'Refurbishment Age', (row) => row.operations.refurbishmentAge, { variant: 'number', format: (value) => `${value} yrs` }),
      leaf('opsBarsAge', 'Bars Age', (row) => row.operations.barsAge, { variant: 'number', format: (value) => `${value} yrs` }),
      leaf('opsFoodAge', 'Food Age', (row) => row.operations.foodAge, { variant: 'number', format: (value) => `${value} yrs` }),
      leaf('opsGamingAge', 'Gaming Age', (row) => row.operations.gamingAge, { variant: 'number', format: (value) => `${value} yrs` }),
      leaf('opsLodgingAge', 'Lodging Age', (row) => row.operations.lodgingAge, { variant: 'number', format: (value) => `${value} yrs` }),
      leaf('opsTheme', 'Design Theme', (row) => row.operations.designTheme),
      leaf('opsSophistication', 'Sophistication Level', (row) => row.operations.sophisticationLevel),
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
      leaf('loyaltyFoodSpend', 'Food Spend / Visit', (row) => row.loyalty.foodSpendPerVisit, { variant: 'number', format: money }),
      leaf('loyaltyBevSpend', 'Bev Spend / Visit', (row) => row.loyalty.beverageSpendPerVisit, { variant: 'number', format: money }),
      leaf('loyaltyGamingSpend', 'Gaming Spend / Visit', (row) => row.loyalty.gamingSpendPerVisit, { variant: 'number', format: money }),
      leaf('loyaltyRecency', 'Visit Recency', (row) => row.loyalty.visitRecencyDays, { variant: 'number', format: (value) => `${value} days` }),
      leaf('loyaltyFrequency', 'Annual Frequency', (row) => row.loyalty.annualFrequency, { variant: 'number', format: (value) => decimal.format(Number(value)) }),
      leaf('loyaltyChurn', 'Churn Rate', (row) => row.loyalty.churnRate, { variant: 'number', format: percent }),
      leaf('loyaltyBookings', 'Bookings Share', (row) => row.loyalty.bookingsShare, { variant: 'number', format: percent }),
      leaf('loyaltyConversion', 'Booking Conversion', (row) => row.loyalty.bookingConversion, { variant: 'number', format: percent }),
      leaf('loyaltyAgeMix', 'Guest Age Mix', (row) => row.loyalty.guestAgeMix),
      leaf('loyaltyGenderMix', 'Guest Gender Mix', (row) => row.loyalty.guestGenderMix),
      leaf('loyaltyFamilyMix', 'Guest Family Mix', (row) => row.loyalty.guestFamilyMix),
      leaf('loyaltyDistance', 'Home Distance Radius', (row) => row.loyalty.homeDistanceRadius, { variant: 'number', format: (value) => `${decimal.format(Number(value))} km` }),
      leaf('loyaltySessionDwell', 'Session Dwell Time', (row) => row.loyalty.sessionDwellTime, { variant: 'number', format: (value) => `${value} min` }),
      leaf('loyaltyTotalDwell', 'Total Dwell Time', (row) => row.loyalty.totalDwellTime, { variant: 'number', format: (value) => `${value} min` }),
      leaf('loyaltyReview', 'Review Score', (row) => row.loyalty.reviewScore, { variant: 'number', format: (value) => `${decimal.format(Number(value))}/5` }),
    ]),
    fieldGroup('underlying-geo', 'Geospatial Context', 'Catchment', [
      leaf('geoPopulation', 'Total Population', (row) => row.catchment.totalPopulation, { variant: 'number', format: count }),
      leaf('geoPopulationGrowth', 'Population Growth', (row) => row.catchment.populationGrowth, { variant: 'number', format: percent }),
      leaf('geoRetail', 'Retail Proximity', (row) => row.catchment.retailCount, { variant: 'number', format: count }),
      leaf('geoUniversities', 'Universities', (row) => row.catchment.universityCount, { variant: 'number', format: count }),
      leaf('geoOffices', 'Office Buildings', (row) => row.catchment.officeCount, { variant: 'number', format: count }),
      leaf('geoTransit', 'Transit Hubs', (row) => row.catchment.transitHubCount, { variant: 'number', format: count }),
      leaf('geoStadiums', 'Stadiums', (row) => row.catchment.stadiumCount, { variant: 'number', format: count }),
      leaf('geoBws', 'BWS Count', (row) => row.catchment.bwsCount, { variant: 'number', format: count }),
      leaf('geoDans', "Dan Murphy's Count", (row) => row.catchment.danMurphysCount, { variant: 'number', format: count }),
    ]),
  ], 'underlying', 'underlying')
}

const allGroups = [basicFacts(), profiles(), gaps(), recommendations(), competition(), distributions(), underlying()]

export function buildColumns(activeGroups: Set<MetricGroupId>) {
  return allGroups.filter((column) => activeGroups.has(column.id as MetricGroupId))
}
