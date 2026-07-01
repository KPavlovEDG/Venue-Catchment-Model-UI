import { axisDefinitions } from './schema'
import type {
  AxisKey,
  AxisProfile,
  CompetitorDetail,
  Daypart,
  RecommendationChange,
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

const regionCenters: Record<string, readonly [number, number]> = {
  'Sydney Metro': [-33.8688, 151.2093],
  'Newcastle & Hunter': [-32.9283, 151.7817],
  'NSW Regional': [-34.4278, 150.8931],
  'Brisbane CBD': [-27.4698, 153.0251],
  'Gold Coast': [-28.0167, 153.4000],
  'QLD Regional': [-26.6500, 153.0667],
  'Melbourne Metro': [-37.8136, 144.9631],
  Geelong: [-38.1499, 144.3617],
  'VIC Regional': [-37.5622, 143.8503],
  'Adelaide Metro': [-34.9285, 138.6007],
  'SA Regional': [-37.8284, 140.7804],
}

const streets = ['George St', 'King St', 'Oxford St', 'High St', 'Pacific Hwy', 'Bay Rd', 'Station St', 'Victoria Rd']
const competitorNames = [
  'The Railway Hotel', 'Civic Social Club', 'The Corner House', 'Union Hotel', 'Market Lane Bar',
  'The Local Arms', 'Parkside Pavilion', 'The Grand Hotel', 'Station Dining Room', 'Harbour Social',
  'The Commercial Club', 'Central Tavern', 'The Neighbourhood', 'The Exchange Bar', 'Crown Hotel',
]
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

function createAxisProfile(random: () => number, axisKey: AxisKey): AxisProfile {
  const definition = axisDefinitions.find((axis) => axis.key === axisKey)!
  const codes = definition.attributes.map((attribute) => attribute.code)
  const venueMix = createMix(random, codes)
  const catchmentMix = createMix(random, codes)
  const gaps = codes.map((code) => Math.abs(venueMix[code] - catchmentMix[code]))
  const gap = Math.min(100, Math.round(gaps.reduce((total, value) => total + value, 0) * 1.35))
  const attributeCompetition = Object.fromEntries(
    codes.map((code) => [code, {
      competitorCount: Math.floor(between(random, 1, 14)),
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

function attributeLabel(axisKey: AxisKey, code: string) {
  return axisDefinitions
    .find((axis) => axis.key === axisKey)!
    .attributes.find((attribute) => attribute.code === code)!.label
}

function competitionForChanges(
  axes: Record<AxisKey, AxisProfile>,
  changes: RecommendationChange[],
  state: 'current' | 'recommended',
  venueSeed: number,
  lga: string,
  venueLatitude: number,
  venueLongitude: number,
) {
  const competitorUniverse = Array.from({ length: 15 }, (_, index) => index)
  const directAnchor = (hashSeed(`${venueSeed}:direct-anchor`) >>> 0) % competitorUniverse.length
  const attributeSets = changes.map((change) => {
    const code = state === 'current' ? change.fromCode : change.toCode
    const count = axes[change.axis].attributeCompetition[code].competitorCount
    const ranked = [...competitorUniverse]
        .filter((competitor) => competitor !== directAnchor)
        .sort((left, right) => {
          const leftScore = hashSeed(`${venueSeed}:${change.axis}:${code}:${left}`) >>> 0
          const rightScore = hashSeed(`${venueSeed}:${change.axis}:${code}:${right}`) >>> 0
          return leftScore - rightScore
        })
        .slice(0, Math.max(0, count - 1))
    return new Set(count > 0 ? [directAnchor, ...ranked] : ranked)
  })
  const competitors = competitorUniverse.reduce<CompetitorDetail[]>((details, competitor) => {
    const matchCount = attributeSets.filter((set) => set.has(competitor)).length
    const type = matchCount === changes.length
      ? 'direct'
      : matchCount / changes.length > 0.5 ? 'indirect' : null
    if (!type) return details
    const overlappingAttributes = changes.flatMap((change, changeIndex) => {
      if (!attributeSets[changeIndex].has(competitor)) return []
      const code = state === 'current' ? change.fromCode : change.toCode
      return [{ axis: change.axis, axisLabel: change.axisLabel, code, label: attributeLabel(change.axis, code) }]
    })
    const positionRandom = randomFactory(hashSeed(`${venueSeed}:competitor-position:${competitor}`))
    const rotationRandom = randomFactory(hashSeed(`${venueSeed}:competitor-rotation`))
    const goldenAngle = Math.PI * (3 - Math.sqrt(5))
    const bearingJitter = (positionRandom() - 0.5) * 0.42
    const bearing = rotationRandom() * Math.PI * 2 + competitor * goldenAngle + bearingJitter
    const distanceKm = 0.12 + Math.sqrt(positionRandom()) * 0.78
    const latitudeOffset = (distanceKm / 111.32) * Math.cos(bearing)
    const longitudeOffset = (distanceKm / (111.32 * Math.cos(venueLatitude * Math.PI / 180))) * Math.sin(bearing)
    details.push({
      id: `${state}-${venueSeed}-${competitor}`,
      name: competitorNames[(competitor + Math.abs(venueSeed)) % competitorNames.length],
      address: `${18 + competitor * 7} ${streets[((competitor + venueSeed) >>> 0) % streets.length]}, ${lga}`,
      latitude: venueLatitude + latitudeOffset,
      longitude: venueLongitude + longitudeOffset,
      type,
      overlappingAttributes,
    })
    return details
  }, [])
  return {
    counts: {
      direct: competitors.filter((competitor) => competitor.type === 'direct').length,
      indirect: competitors.filter((competitor) => competitor.type === 'indirect').length,
    },
    competitors,
  }
}

export function generateVenues(daypart: Daypart): VenueRecord[] {
  const daypartSeed = hashSeed(daypart)

  return venueNames.map((name, index) => {
    const random = randomFactory(daypartSeed + index * 7919)
    const [state, region, lga] = locations[index % locations.length]
    const [regionLatitude, regionLongitude] = regionCenters[region]
    const axes = Object.fromEntries(
      axisDefinitions.map((axis) => [axis.key, createAxisProfile(random, axis.key)]),
    ) as Record<AxisKey, AxisProfile>
    const macroGap = Math.round(
      Object.values(axes).reduce((total, axis) => total + axis.gap, 0) / axisDefinitions.length,
    )
    const changeCount = macroGap < 32 ? 2 : 2 + Math.floor(random() * 4)
    const highestAxes = [...axisDefinitions]
      .sort((a, b) => axes[b.key].gap - axes[a.key].gap)
      .slice(0, changeCount)
    const changes = highestAxes.map((axis): RecommendationChange => {
      const profile = axes[axis.key]
      if (profile.targetDominant === profile.currentDominant) {
        profile.targetDominant = Object.entries(profile.catchmentMix)
          .filter(([code]) => code !== profile.currentDominant)
          .sort((a, b) => b[1] - a[1])[0][0]
      }
      return {
        axis: axis.key,
        axisLabel: axis.label.replace(/^Axis \d+: /, ''),
        fromCode: profile.currentDominant,
        fromLabel: attributeLabel(axis.key, profile.currentDominant),
        toCode: profile.targetDominant,
        toLabel: attributeLabel(axis.key, profile.targetDominant),
        gap: profile.gap,
      }
    })
    const venueSeed = daypartSeed + index * 7919
    const latitude = regionLatitude + (random() - 0.5) * 0.24
    const longitude = regionLongitude + (random() - 0.5) * 0.28
    const currentCompetition = competitionForChanges(axes, changes, 'current', venueSeed, lga, latitude, longitude)
    const recommendedCompetition = competitionForChanges(axes, changes, 'recommended', venueSeed, lga, latitude, longitude)

    return {
      id: `VCE-${String(index + 1).padStart(3, '0')}`,
      name,
      address: `${12 + index * 3} ${streets[index % streets.length]}, ${lga}`,
      state,
      region,
      lga,
      latitude,
      longitude,
      macroGap,
      axes,
      recommendation: {
        changes,
        currentCompetition: currentCompetition.counts,
        recommendedCompetition: recommendedCompetition.counts,
        currentCompetitors: currentCompetition.competitors,
        recommendedCompetitors: recommendedCompetition.competitors,
      },
      operatorComment: {
        currentPositioning: '',
        recommendedPositioning: '',
        author: '',
        updatedAt: '',
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
