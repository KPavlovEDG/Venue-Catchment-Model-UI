import type { AxisKey, Daypart, MetricGroupId } from '../types/domain'

export interface AxisAttribute {
  code: string
  label: string
}

export interface AxisDefinition {
  key: AxisKey
  label: string
  prompt: string
  attributes: AxisAttribute[]
}

export const dayparts: Daypart[] = [
  'Weekly Aggregated',
  'Mid-Week Lunch',
  'After-Work Trade',
  'High-Velocity Nightlife',
  'Weekend Leisure',
]

export const axisDefinitions: AxisDefinition[] = [
  {
    key: 'customer',
    label: 'Axis 1: Customer Profile',
    prompt: 'Who',
    attributes: [
      { code: 'FAM', label: 'Families with Kids' },
      { code: 'YPR', label: 'Young Professionals & Corporates' },
      { code: 'BCL', label: 'Blue-Collar & Tradies' },
      { code: 'RET', label: 'Retirees & Seniors' },
      { code: 'STUD', label: 'Students & Gen-Z Youth' },
      { code: 'TOUR', label: 'Tourists & Transient Visitors' },
    ],
  },
  {
    key: 'affluence',
    label: 'Axis 2: Affluence & Pricing Alignment',
    prompt: 'How much',
    attributes: [
      { code: 'ULTRA', label: 'Luxury / Premium Core' },
      { code: 'ASPIR', label: 'Aspirational Above-Average Price Tier' },
      { code: 'MID', label: 'Casual Mainstream' },
      { code: 'VALUE', label: 'Price Sensitive / Budget Focus' },
    ],
  },
  {
    key: 'occasion',
    label: 'Axis 3: Occasion',
    prompt: 'Why',
    attributes: [
      { code: 'GATHERING', label: 'Frictionless Gathering' },
      { code: 'RELIEF', label: 'Domestic Relief' },
      { code: 'AMPLIFIED-TRIBAL', label: 'High-Energy & Shared Passions' },
      { code: 'AMPLIFIED-INDULGENCE', label: 'Premium Sensory Adventure' },
      { code: 'SHIFT', label: 'Environmental Shift' },
    ],
  },
  {
    key: 'food',
    label: 'Axis 4: Food Concept',
    prompt: 'What: Food',
    attributes: [
      { code: 'PUB-CLASSIC', label: 'Traditional Pub Grub' },
      { code: 'GASTRO-MODERN', label: 'Modern Australian / Craft Focus' },
      { code: 'FOOD-FINE', label: 'Premium Dining' },
      { code: 'FOOD-MINIMAL', label: 'Bar Snacks & Light Counter' },
    ],
  },
  {
    key: 'beverage',
    label: 'Axis 5: Beverage Concept',
    prompt: 'What: Beverage',
    attributes: [
      { code: 'BEV-MAINSTREAM', label: 'Commercial Volumetric' },
      { code: 'CRAFT-COCKTAIL', label: 'Craft & Contemporary Bar' },
      { code: 'PREMIUM-CELLAR', label: 'Premium Wine & Top-Shelf' },
      { code: 'BEV-VALUE-PROMO', label: 'High-Volume Discount Focus' },
    ],
  },
  {
    key: 'gaming',
    label: 'Axis 6: Gaming Profile',
    prompt: 'What: Gaming',
    attributes: [
      { code: 'NONE', label: 'No Gaming' },
      { code: 'WAG-SOC', label: 'Social Wagering' },
      { code: 'EGM-CAS', label: 'Core / Standard EGM Room' },
      { code: 'EGM-VIP', label: 'High-Value VIP Gaming' },
    ],
  },
  {
    key: 'accommodation',
    label: 'Axis 7: Accommodation Profile',
    prompt: 'What: Accommodation',
    attributes: [
      { code: 'NONE', label: 'No Lodging' },
      { code: 'WEEKDAY-COMM', label: 'Corporate, Trade & Transit' },
      { code: '7-DAY-COMMUNITY', label: 'Balanced VFR & Local Social' },
      { code: 'LEISURE-RESORT', label: 'Leisure & Holiday Resort' },
    ],
  },
  {
    key: 'function',
    label: 'Axis 8: Event & Function Profile',
    prompt: 'What: Functions',
    attributes: [
      { code: 'NONE', label: 'No Event Space' },
      { code: 'CORP-FUNC', label: 'Corporate & Networking' },
      { code: 'MILESTONE', label: 'Private Celebrations' },
      { code: 'PREMIUM-GALA', label: 'High-End Galas & Weddings' },
    ],
  },
]

export const metricGroups: Array<{
  id: MetricGroupId
  label: string
  description: string
  defaultVisible: boolean
}> = [
  { id: 'basic', label: 'Basic Facts', description: 'Address, geography and commercial facts', defaultVisible: true },
  { id: 'profiles', label: 'Strategic Profiles', description: 'Current vs target attributes', defaultVisible: true },
  { id: 'gaps', label: 'Results (Gap Scores)', description: 'Macro and axis variance', defaultVisible: true },
  { id: 'recommendations', label: 'Recommendations', description: 'Attribute shifts, competition and comments', defaultVisible: true },
  { id: 'competition', label: 'Competitive Overlay', description: 'Count and share of time', defaultVisible: false },
  { id: 'distribution', label: 'Results (%)', description: 'Venue / catchment mixes', defaultVisible: false },
  { id: 'underlying', label: 'Underlying Metrics', description: 'Assets, operations and registry', defaultVisible: false },
]

export const regionsByState: Record<string, string[]> = {
  NSW: ['Sydney Metro', 'Newcastle & Hunter', 'NSW Regional'],
  QLD: ['Brisbane CBD', 'Gold Coast', 'QLD Regional'],
  VIC: ['Melbourne Metro', 'Geelong', 'VIC Regional'],
  SA: ['Adelaide Metro', 'SA Regional'],
}
