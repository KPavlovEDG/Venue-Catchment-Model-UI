import { axisDefinitions } from './schema'
import type {
  AlignmentStatus,
  AxisKey,
  AxisProfile,
  Daypart,
  RecommendationType,
  VenueRecord,
} from '../types/domain'

const venueNames = [
  'The Royal Oak', 'Kings Cross Hotel', 'Westside Sports Bar', 'Riverview Club',
  'Oakhill Tavern', 'Marina Lounge', 'The Junction', 'Valley Tavern',
  'Pine Tree Inn', 'Bayside Tavern', 'The Golden Sheaf', 'Northern Star',
  'CBD Exchange', 'Harbour View Hotel', 'The Courthouse', 'Railway Arms',
  'Oxford Social', 'The Sandstone', 'Crown & Anchor', 'The Park House',
  'Albion Hotel', 'The Lakeside', 'Boundary Hotel', 'The Commercial',
  'Seabreeze Pavilion', 'The Foundry', 'Central Hotel', 'The Village Green',
  'Redfern Social', 'The Camellia', 'Grand Junction', 'The Exchange Hotel',
  'The Peninsula', 'Newmarket Tavern', 'The Local', 'The Terrace',
  'Waterloo Hotel', 'The Mill', 'Bridgeview Hotel', 'The Regent',
  'The Clocktower', 'Rose & Crown', 'The Beach House', 'The Metropolitan',
  'The Australian', 'The Pacific', 'The Carrington', 'The Belmore',
  'The Clarence', 'The Woolstore',
]

const locations = [
  ['NSW', 'Sydney Metro', 'City of Sydney'], ['NSW', 'Sydney Metro', 'Inner West'],
  ['NSW', 'Newcastle & Hunter', 'Newcastle'], ['NSW', 'NSW Regional', 'Wollongong'],
  ['QLD', 'Brisbane CBD', 'Brisbane City'], ['QLD', 'Gold Coast', 'Gold Coast'],
  ['QLD', 'QLD Regional', 'Sunshine Coast'], ['VIC', 'Melbourne Metro', 'Yarra'],
  ['VIC', 'Geelong', 'Greater Geelong'], ['VIC', 'VIC Regional', 'Ballarat'],
  ['SA', 'Adelaide Metro', 'Adelaide'], ['SA', 'SA Regional', 'Mount Gambier'],
] as const

const clusters = [
  'Community Local', 'Family Bistro', 'Premium Dining', 'Entertainment Hub',
  'Gaming-Led Local', 'Sports & Social', 'Corporate Social', 'Leisure Destination',
]

const streets = ['George St', 'King St', 'Oxford St', 'High St', 'Pacific Hwy', 'Bay Rd', 'Station St', 'Victoria Rd']
const kitchenTiers = ['Snack-only', 'Bistro', 'Full Restaurant']
const kitchenTypes = ['Classic Pub', 'Modern Australian', 'Asian Fusion', 'Grill', 'Minimal']
const serviceStyles = ['Counter Service', 'Hybrid', 'Table Service', 'Waitstaff']
const themes = ['Classic', 'Coastal', 'Industrial', 'Contemporary', 'Art Deco']
const sophistication = ['Basic', 'Standard', 'Premium']

function hashSeed(value: string) {
  return [...value].reduce((total, char) => ((total << 5) - total + char.charCodeAt(0)) | 0, 0)
}

function randomFactory(seed: number) {
  let value = seed >>> 0
  return () => {
    value += 0x6d2b79f5
    let result = value
    result = Math.imul(result ^ (result >>> 15), result | 1)
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61)
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296
  }
}

const between = (random: () => number, min: number, max: number) =>
  Math.round((min + random() * (max - min)) * 10) / 10

const pick = <T,>(random: () => number, values: readonly T[]): T =>
  values[Math.floor(random() * values.length)]

function createMix(random: () => number, codes: string[]) {
  const weights = codes.map(() => 0.25 + random())
  const sum = weights.reduce((total, value) => total + value, 0)
  const result: Record<string, number> = {}
  let running = 0
  codes.forEach((code, index) => {
    const value = index === codes.length - 1 ? 100 - running : Math.round((weights[index] / sum) * 100)
    result[code] = value
    running += value
  })
  return result
}

function dominant(mix: Record<string, number>) {
  return Object.entries(mix).sort((a, b) => b[1] - a[1])[0][0]
}

function alignmentStatus(gap: number): AlignmentStatus {
  if (gap >= 65) return 'Misaligned'
  if (gap >= 38) return 'Watch'
  return 'Aligned'
}

function createAxisProfile(random: () => number, axisKey: AxisKey): AxisProfile {
  const definition = axisDefinitions.find((axis) => axis.key === axisKey)!
  const codes = definition.attributes.map((attribute) => attribute.code)
  const venueMix = createMix(random, codes)
  const catchmentMix = createMix(random, codes)
  const gaps = codes.map((code) => Math.abs(venueMix[code] - catchmentMix[code]))
  const gap = Math.min(100, Math.round(gaps.reduce((total, value) => total + value, 0) * 1.35))
  const attributeCompetition = Object.fromEntries(
    codes.map((code) => [code, {
      competitorCount: Math.floor(between(random, 0, 14)),
      competitorShareOfTime: between(random, 2, 42),
    }]),
  )

  return {
    currentDominant: dominant(venueMix),
    targetDominant: dominant(catchmentMix),
    gap,
    venueMix,
    catchmentMix,
    alhShareOfTime: between(random, 8, 58),
    directCompetitorShareOfTime: between(random, 10, 55),
    adjacentCompetitorShareOfTime: between(random, 5, 35),
    directCompetitorCount: Math.floor(between(random, 0, 11)),
    adjacentCompetitorCount: Math.floor(between(random, 1, 18)),
    attributeCompetition,
  }
}

export function generateVenues(daypart: Daypart): VenueRecord[] {
  const daypartSeed = hashSeed(daypart)

  return venueNames.map((name, index) => {
    const random = randomFactory(daypartSeed + index * 7919)
    const [state, region, lga] = locations[index % locations.length]
    const axes = Object.fromEntries(
      axisDefinitions.map((axis) => [axis.key, createAxisProfile(random, axis.key)]),
    ) as Record<AxisKey, AxisProfile>
    const macroGap = Math.round(
      Object.values(axes).reduce((total, axis) => total + axis.gap, 0) / axisDefinitions.length,
    )
    const currentCluster = clusters[index % clusters.length]
    const targetCluster = macroGap < 32 ? currentCluster : pick(random, clusters.filter((cluster) => cluster !== currentCluster))
    const type: RecommendationType = macroGap < 32
      ? 'Maintain'
      : pick(random, ['CAPEX', 'Operational', 'Marketing'] as const)
    const highestAxes = [...axisDefinitions]
      .sort((a, b) => axes[b.key].gap - axes[a.key].gap)
      .slice(0, 3)

    return {
      id: `VCE-${String(index + 1).padStart(3, '0')}`,
      name,
      address: `${12 + index * 3} ${streets[index % streets.length]}, ${lga}`,
      state,
      region,
      lga,
      latitude: -33.86 + random() * 6.5,
      longitude: 151.2 - random() * 9.4,
      currentCluster,
      targetCluster,
      alignmentStatus: alignmentStatus(macroGap),
      macroGap,
      axes,
      recommendation: {
        type,
        from: currentCluster,
        to: targetCluster,
        action: type === 'Maintain'
          ? 'Maintain current proposition and monitor leading indicators.'
          : `${type}: Strengthen ${targetCluster.toLowerCase()} proposition for the selected daypart.`,
        fromDynamics: `${axes.customer.currentDominant} audience with ${axes.food.currentDominant} offer; ${axes.customer.directCompetitorCount} direct rivals.`,
        toDynamics: `${axes.customer.targetDominant} demand with lower competitive friction and stronger local fit.`,
        drivers: highestAxes.map((axis) => `${axis.label.replace(/^Axis \d+: /, '')} gap ${axes[axis.key].gap}`),
      },
      assets: {
        indoorSeating: Math.floor(between(random, 45, 420)),
        outdoorSeating: Math.floor(between(random, 0, 240)),
        winterGardenSeating: Math.floor(between(random, 0, 90)),
        indoorArea: Math.floor(between(random, 350, 2800)),
        outdoorArea: Math.floor(between(random, 0, 1600)),
        winterGardenArea: Math.floor(between(random, 0, 420)),
        totalEgmCount: Math.floor(between(random, 0, 48)),
        premiumEgmCount: Math.floor(between(random, 0, 16)),
        poolTables: Math.floor(between(random, 0, 5)),
        dartLanes: Math.floor(between(random, 0, 8)),
        arcadeCabinets: Math.floor(between(random, 0, 7)),
        screenCount: Math.floor(between(random, 4, 42)),
        projectors: Math.floor(between(random, 0, 5)),
        lodgingRooms: Math.floor(between(random, 0, 54)),
        functionRooms: Math.floor(between(random, 0, 8)),
        buildingFootprint: Math.floor(between(random, 480, 4500)),
      },
      operations: {
        kitchenTier: pick(random, kitchenTiers), kitchenType: pick(random, kitchenTypes),
        serviceStyle: pick(random, serviceStyles), openTime: pick(random, ['09:00', '10:00', '11:00', '12:00']),
        closeTime: pick(random, ['22:00', '00:00', '01:00', '03:00']), tradingDays: Math.floor(between(random, 5, 7)),
        kidsArea: random() > 0.64, petFriendly: random() > 0.48, showsUfc: random() > 0.42,
        onSiteParking: random() > 0.35, parkingSpaces: Math.floor(between(random, 0, 210)), paidParking: random() > 0.72,
        refurbishmentAge: Math.floor(between(random, 0, 18)), barsAge: Math.floor(between(random, 0, 14)),
        foodAge: Math.floor(between(random, 0, 14)), gamingAge: Math.floor(between(random, 0, 12)),
        lodgingAge: Math.floor(between(random, 0, 18)), designTheme: pick(random, themes),
        sophisticationLevel: pick(random, sophistication),
      },
      financials: {
        rollingEbit: between(random, 0.6, 8.8) * 1_000_000,
        ebitdaGrowth: between(random, -12, 24), threeYearCagr: between(random, -5, 18), roi: between(random, 3, 26),
        fundsEmployed: between(random, 4, 42) * 1_000_000, tradingDensity: Math.floor(between(random, 3200, 16800)),
        attachedRetailEbit: between(random, 0, 2.6) * 1_000_000, totalTransactions: Math.floor(between(random, 80_000, 610_000)),
        transactionsGrowth: between(random, -9, 21), foodSales: between(random, 1.2, 9.8) * 1_000_000,
        barSales: between(random, 1.8, 12.5) * 1_000_000, gamingSales: between(random, 0, 11.2) * 1_000_000,
        lodgingSales: between(random, 0, 4.5) * 1_000_000, fbMix: between(random, 22, 88),
      },
      loyalty: {
        penetrationRate: between(random, 8, 67), loyaltyTierMix: pick(random, ['Gold-led', 'Silver-led', 'Balanced', 'Bronze-led']),
        acquisitionGrowth: between(random, -3, 22), promoRedemptionRate: between(random, 2, 38),
        foodSpendPerVisit: between(random, 22, 86), beverageSpendPerVisit: between(random, 18, 92),
        gamingSpendPerVisit: between(random, 0, 240), visitRecencyDays: Math.floor(between(random, 3, 68)),
        annualFrequency: between(random, 2, 31), churnRate: between(random, 4, 32), bookingsShare: between(random, 3, 58),
        bookingConversion: between(random, 2, 24), guestAgeMix: pick(random, ['18-34 led', '35-54 led', '55+ led', 'Balanced']),
        guestGenderMix: pick(random, ['Balanced', 'Female-led', 'Male-led']), guestFamilyMix: pick(random, ['Families', 'Singles', 'Couples', 'Balanced']),
        homeDistanceRadius: between(random, 1.2, 18), sessionDwellTime: Math.floor(between(random, 18, 120)),
        totalDwellTime: Math.floor(between(random, 42, 230)), reviewScore: between(random, 3.1, 4.9),
      },
      catchment: {
        totalPopulation: Math.floor(between(random, 18_000, 210_000)), populationGrowth: between(random, -1.2, 8.5),
        retailCount: Math.floor(between(random, 4, 110)), universityCount: Math.floor(between(random, 0, 9)),
        officeCount: Math.floor(between(random, 1, 86)), transitHubCount: Math.floor(between(random, 0, 14)),
        stadiumCount: Math.floor(between(random, 0, 5)), bwsCount: Math.floor(between(random, 0, 9)),
        danMurphysCount: Math.floor(between(random, 0, 5)),
      },
    }
  })
}
