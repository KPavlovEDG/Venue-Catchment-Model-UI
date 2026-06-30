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
      { code: 'FAM', label: 'Families' },
      { code: 'YPR', label: 'Young Professionals' },
      { code: 'BCL', label: 'Blue-Collar' },
      { code: 'RET', label: 'Retirees' },
      { code: 'STUD', label: 'Students' },
      { code: 'TOUR', label: 'Tourists' },
    ],
  },
  {
    key: 'affluence',
    label: 'Axis 2: Affluence & Pricing',
    prompt: 'How much',
    attributes: [
      { code: 'ULTRA', label: 'Luxury' },
      { code: 'ASPIR', label: 'Aspirational' },
      { code: 'MID', label: 'Mainstream' },
      { code: 'VALUE', label: 'Budget' },
    ],
  },
  {
    key: 'occasion',
    label: 'Axis 3: Occasion',
    prompt: 'Why',
    attributes: [
      { code: 'GATHERING', label: 'Social' },
      { code: 'RELIEF', label: 'Domestic' },
      { code: 'AMPLIFIED-TRIBAL', label: 'Sports' },
      { code: 'AMPLIFIED-INDULGENCE', label: 'Experiential' },
      { code: 'SHIFT', label: 'WFH' },
    ],
  },
  {
    key: 'food',
    label: 'Axis 4: Food Concept',
    prompt: 'What: Food',
    attributes: [
      { code: 'PUB-CLASSIC', label: 'Grub' },
      { code: 'GASTRO-MODERN', label: 'Platter / Craft' },
      { code: 'FOOD-FINE', label: 'Premium' },
      { code: 'FOOD-MINIMAL', label: 'Snack Counter' },
    ],
  },
  {
    key: 'beverage',
    label: 'Axis 5: Beverage Concept',
    prompt: 'What: Beverage',
    attributes: [
      { code: 'BEV-MAINSTREAM', label: 'Lager' },
      { code: 'CRAFT-COCKTAIL', label: 'Cocktail' },
      { code: 'PREMIUM-CELLAR', label: 'Fine Wine' },
      { code: 'BEV-VALUE-PROMO', label: 'Volume Discount' },
    ],
  },
  {
    key: 'gaming',
    label: 'Axis 6: Gaming Profile',
    prompt: 'What: Gaming',
    attributes: [
      { code: 'NONE', label: 'No Gaming' },
      { code: 'WAG-SOC', label: 'Social TAB' },
      { code: 'EGM-CAS', label: 'Standard Room' },
      { code: 'EGM-VIP', label: 'High-Value Room' },
    ],
  },
  {
    key: 'accommodation',
    label: 'Axis 7: Accommodation Profile',
    prompt: 'What: Accommodation',
    attributes: [
      { code: 'NONE', label: 'No Rooms' },
      { code: 'WEEKDAY-COMM', label: 'Corporate Room' },
      { code: '7-DAY-COMMUNITY', label: 'Balanced Room' },
      { code: 'LEISURE-RESORT', label: 'Holiday Resort' },
    ],
  },
  {
    key: 'function',
    label: 'Axis 8: Event & Function',
    prompt: 'What: Functions',
    attributes: [
      { code: 'NONE', label: 'No Space' },
      { code: 'CORP-FUNC', label: 'Networking' },
      { code: 'MILESTONE', label: 'Private Party' },
      { code: 'PREMIUM-GALA', label: 'Wedding / Gala' },
    ],
  },
]

export const metricGroups: Array<{
  id: MetricGroupId
  label: string
  description: string
  defaultVisible: boolean
}> = [
  { id: 'basic', label: 'Basic Facts', description: 'Venue and catchment identity', defaultVisible: true },
  { id: 'profiles', label: 'Strategic Profiles', description: 'Current vs target attributes', defaultVisible: true },
  { id: 'gaps', label: 'Results (Gap Scores)', description: 'Macro and axis variance', defaultVisible: true },
  { id: 'recommendations', label: 'Recommendations', description: 'Actions and rationale', defaultVisible: true },
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

