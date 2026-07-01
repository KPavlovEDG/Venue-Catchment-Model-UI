export type AxisKey =
  | 'customer'
  | 'affluence'
  | 'occasion'
  | 'food'
  | 'beverage'
  | 'gaming'
  | 'accommodation'
  | 'function'

export type Daypart =
  | 'Weekly Aggregated'
  | 'Mid-Week Lunch'
  | 'After-Work Trade'
  | 'High-Velocity Nightlife'
  | 'Weekend Leisure'

export type DashboardView = 'map' | 'grid'
export type MapMetric = 'overall' | AxisKey
export type GapPriority = 'all' | 'high' | 'medium' | 'low'

export interface MapLayers {
  catchmentRadius: boolean
  competitors: boolean
}

export interface AxisProfile {
  currentDominant: string
  targetDominant: string
  gap: number
  venueMix: Record<string, number>
  catchmentMix: Record<string, number>
  alhShareOfTime: number
  directCompetitorShareOfTime: number
  adjacentCompetitorShareOfTime: number
  directCompetitorCount: number
  adjacentCompetitorCount: number
  attributeCompetition: Record<
    string,
    { competitorCount: number; competitorShareOfTime: number }
  >
}

export interface RecommendationChange {
  axis: AxisKey
  axisLabel: string
  fromCode: string
  fromLabel: string
  toCode: string
  toLabel: string
  gap: number
}

export interface CompetitorCounts {
  direct: number
  indirect: number
}

export interface CompetitorOverlap {
  axis: AxisKey
  axisLabel: string
  code: string
  label: string
}

export interface CompetitorDetail {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  type: 'direct' | 'indirect'
  overlappingAttributes: CompetitorOverlap[]
}

export interface VenueComment {
  currentPositioning: string
  recommendedPositioning: string
  author: string
  updatedAt: string
}

export interface VenueAssets {
  indoorSeating: number
  outdoorSeating: number
  winterGardenSeating: number
  indoorArea: number
  outdoorArea: number
  winterGardenArea: number
  totalEgmCount: number
  premiumEgmCount: number
  poolTables: number
  dartLanes: number
  arcadeCabinets: number
  screenCount: number
  projectors: number
  lodgingRooms: number
  functionRooms: number
  buildingFootprint: number
}

export interface VenueOperations {
  kitchenTier: string
  kitchenType: string
  serviceStyle: string
  openTime: string
  closeTime: string
  tradingDays: number
  kidsArea: boolean
  petFriendly: boolean
  showsUfc: boolean
  onSiteParking: boolean
  parkingSpaces: number
  paidParking: boolean
  refurbishmentAge: number
  barsAge: number
  foodAge: number
  gamingAge: number
  lodgingAge: number
  designTheme: string
  sophisticationLevel: string
}

export interface VenueFinancials {
  rollingEbit: number
  ebitdaGrowth: number
  threeYearCagr: number
  roi: number
  fundsEmployed: number
  tradingDensity: number
  attachedRetailEbit: number
  totalTransactions: number
  transactionsGrowth: number
  foodSales: number
  barSales: number
  gamingSales: number
  lodgingSales: number
  fbMix: number
}

export interface VenueLoyalty {
  penetrationRate: number
  loyaltyTierMix: string
  acquisitionGrowth: number
  promoRedemptionRate: number
  foodSpendPerVisit: number
  beverageSpendPerVisit: number
  gamingSpendPerVisit: number
  visitRecencyDays: number
  annualFrequency: number
  churnRate: number
  bookingsShare: number
  bookingConversion: number
  guestAgeMix: string
  guestGenderMix: string
  guestFamilyMix: string
  homeDistanceRadius: number
  sessionDwellTime: number
  totalDwellTime: number
  reviewScore: number
}

export interface CatchmentContext {
  totalPopulation: number
  populationGrowth: number
  retailCount: number
  universityCount: number
  officeCount: number
  transitHubCount: number
  stadiumCount: number
  bwsCount: number
  danMurphysCount: number
}

export interface VenueRecord {
  id: string
  name: string
  address: string
  state: string
  region: string
  lga: string
  latitude: number
  longitude: number
  macroGap: number
  axes: Record<AxisKey, AxisProfile>
  recommendation: {
    changes: RecommendationChange[]
    currentCompetition: CompetitorCounts
    recommendedCompetition: CompetitorCounts
    currentCompetitors: CompetitorDetail[]
    recommendedCompetitors: CompetitorDetail[]
  }
  operatorComment: VenueComment
  assets: VenueAssets
  operations: VenueOperations
  financials: VenueFinancials
  loyalty: VenueLoyalty
  catchment: CatchmentContext
}

export interface SavedCohort {
  id: string
  name: string
  venueIds: string[]
  createdAt: string
}

export type MetricGroupId =
  | 'identity'
  | 'basic'
  | 'profiles'
  | 'gaps'
  | 'recommendations'
  | 'competition'
  | 'distribution'
  | 'underlying'

export interface ColumnFilterValue {
  query?: string
  selected?: string[]
  min?: number
  max?: number
}
