export type ProductType =
  | 'Medicine'
  | 'Wellness Product'
  | 'Food/Nutraceutical'
  | 'Cosmetic'
  | 'Other'

export type MarketJurisdiction = 'India' | 'International' | 'Both'

export type InnovationRecord = {
  id: string
  name: string
  productType: ProductType
  ingredients: string
  intendedUse: string
  description: string
  market: MarketJurisdiction
  classification: string
  confidence: number
  readiness: number
  jurisdiction: string
  createdAt: string
}

export type EvidenceItem = {
  id: string
  title: string
  authority: string
  section: string
  page: string
  relevance: string
  viewLabel: string
  status: 'Demo / Placeholder Evidence'
}

export type SourceRecord = {
  id: string
  source: string
  authority: string
  jurisdiction: string
  category: string
  version: string
  status: string
}

export type ActivityItem = {
  id: string
  type: string
  label: string
  time: string
}
