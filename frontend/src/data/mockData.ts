import type { ActivityItem, EvidenceItem, InnovationRecord, SourceRecord } from '../types'

export const demoInnovation: InnovationRecord = {
  id: 'INV-DEMO-001',
  name: 'Ashwagandha + Brahmi Wellness Capsule',
  productType: 'Wellness Product',
  ingredients: 'Withania somnifera extract; Bacopa monnieri extract',
  intendedUse: 'Stress management and cognitive wellness',
  description:
    'A wellness-oriented capsule combining standardized botanical extracts.',
  market: 'India',
  classification: 'Ayurveda-Aahar / Wellness Product',
  confidence: 86,
  readiness: 72,
  jurisdiction: 'India',
  createdAt: '2026-09-09',
}

export const mockEvidence: EvidenceItem[] = [
  {
    id: 'e1',
    title: 'Product classification precedent',
    authority: 'Demo / Placeholder Authority',
    section: 'Section 2.1',
    page: 'Page 12',
    relevance: 'High',
    viewLabel: 'View Source',
    status: 'Demo / Placeholder Evidence',
  },
  {
    id: 'e2',
    title: 'Traditional Knowledge signal review',
    authority: 'Demo / Placeholder Authority',
    section: 'Annexure B',
    page: 'Page 8',
    relevance: 'Medium',
    viewLabel: 'View Source',
    status: 'Demo / Placeholder Evidence',
  },
  {
    id: 'e3',
    title: 'ABS and jurisdictional guidance',
    authority: 'Demo / Placeholder Authority',
    section: 'Guidance Note 3',
    page: 'Page 5',
    relevance: 'High',
    viewLabel: 'View Source',
    status: 'Demo / Placeholder Evidence',
  },
]

export const activityFeed: ActivityItem[] = [
  { id: 'a1', type: 'Classification', label: 'Classification review completed', time: 'Today' },
  { id: 'a2', type: 'Evidence', label: 'IP screening evidence updated', time: 'Yesterday' },
  { id: 'a3', type: 'ABS', label: 'ABS review checklist drafted', time: '2 days ago' },
  { id: 'a4', type: 'Regulatory', label: 'Regulatory pathway reviewed', time: '3 days ago' },
]

export const sourceRecords: SourceRecord[] = [
  {
    id: 'src1',
    source: 'Ayurveda Guidance Note',
    authority: 'Demo / Placeholder Authority',
    jurisdiction: 'India',
    category: 'Regulatory',
    version: 'v1.0',
    status: 'Demo / Placeholder — replace with verified official corpus',
  },
  {
    id: 'src2',
    source: 'TK sensitivity profile',
    authority: 'Demo / Placeholder Authority',
    jurisdiction: 'India',
    category: 'Traditional Knowledge',
    version: 'v2.1',
    status: 'Demo / Placeholder — replace with verified official corpus',
  },
  {
    id: 'src3',
    source: 'ABS compliance checklist',
    authority: 'Demo / Placeholder Authority',
    jurisdiction: 'India',
    category: 'ABS',
    version: 'v1.4',
    status: 'Demo / Placeholder — replace with verified official corpus',
  },
]

export const regulatoryUpdates = [
  { heading: 'Product labeling review', note: 'Prototype / Curated Monitoring', state: 'Watchlist' },
  { heading: 'Export documentation checks', note: 'Prototype / Curated Monitoring', state: 'Action required' },
  { heading: 'Traditional knowledge review', note: 'Prototype / Curated Monitoring', state: 'Monitor' },
]

export const defaultQuestions = [
  'Can I patent my Ashwagandha formulation?',
  'Does traditional knowledge affect patentability?',
  'What should I check before exporting this product?',
  'Does this product require ABS assessment?',
]

export const defaultAssistantAnswer = {
  answer:
    'A wellness product combining botanical ingredients may be assessed under local product classification and traditional knowledge review before any filing strategy is finalised.',
  keyConsiderations: [
    'Check whether the formulation contains known traditional knowledge elements or disclosed public-domain ingredients.',
    'Verify whether the product is positioned as medicine, wellness, nutraceutical, or food and how that changes the regulatory pathway.',
    'Assess whether source materials and sharing arrangements trigger ABS obligations.',
  ],
  disclaimer:
    'This is preliminary guidance only and is not a legal determination. Evidence in this prototype is demo placeholder material.',
  confidence: '86%',
}
