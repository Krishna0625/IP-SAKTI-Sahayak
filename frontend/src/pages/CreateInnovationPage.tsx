import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Droplet,
  FlaskConical,
  Leaf,
  LoaderCircle,
  Package,
  Pill,
  Sparkles,
  Utensils,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { demoInnovation } from '../data/mockData'
import type { InnovationRecord, MarketJurisdiction, ProductType } from '../types'
import './create-innovation-overrides.css'

const productTypes: Array<{
  value: ProductType
  label: string
  description: string
}> = [
  { value: 'Medicine', label: 'Medicine', description: 'Therapeutic or medicinal product' },
  { value: 'Wellness Product', label: 'Wellness product', description: 'Everyday health and wellbeing product' },
  { value: 'Food/Nutraceutical', label: 'Food / nutraceutical', description: 'Functional food or nutrition-focused product' },
  { value: 'Cosmetic', label: 'Cosmetic', description: 'Personal care, beauty, or topical product' },
  { value: 'Other', label: 'Other', description: 'Any other innovation category' },
]

const productIcons = {
  Medicine: Pill,
  'Wellness Product': Leaf,
  'Food/Nutraceutical': Utensils,
  Cosmetic: Droplet,
  Other: Package,
} as const

const jurisdictions: Array<{
  value: MarketJurisdiction
  label: string
  description: string
}> = [
  { value: 'India', label: 'India', description: 'Launch or protect primarily in India' },
  { value: 'International', label: 'International', description: 'Target one or more overseas markets' },
  { value: 'Both', label: 'India + international', description: 'Plan for India and international markets' },
]

const storageKey = 'ip-sakti-innovations'

const blankForm = {
  productType: 'Wellness Product' as ProductType,
  name: '',
  ingredients: '',
  intendedUse: '',
  description: '',
  market: 'India' as MarketJurisdiction,
}

export function CreateInnovationPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(blankForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const isValid = useMemo(
    () => Boolean(form.name.trim() && form.ingredients.trim() && form.intendedUse.trim() && form.description.trim()),
    [form],
  )

  useEffect(() => {
    const existing = localStorage.getItem(storageKey)
    if (!existing) {
      localStorage.setItem(storageKey, JSON.stringify([demoInnovation]))
    }
  }, [])

  const updateField = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  const validateStep = () => {
    if (step !== 2) return true

    const nextErrors: Record<string, string> = {}
    if (!form.name.trim()) nextErrors.name = 'Add a product name to continue.'
    if (!form.ingredients.trim()) nextErrors.ingredients = 'Add the main ingredients or materials.'
    if (!form.intendedUse.trim()) nextErrors.intendedUse = 'Describe the intended use.'
    if (!form.description.trim()) nextErrors.description = 'Add a short product description.'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const nextStep = () => {
    if (step === 2 && !validateStep()) return
    setStep((current) => Math.min(current + 1, 4))
  }

  const prevStep = () => {
    setStep((current) => Math.max(current - 1, 1))
  }

  const handleAnalyze = () => {
    if (!isValid) {
      setStep(2)
      validateStep()
      return
    }

    setIsAnalyzing(true)

    window.setTimeout(() => {
      const innovationId = `INV-${Date.now().toString(36).toUpperCase()}`
      const record: InnovationRecord = {
        id: innovationId,
        name: form.name.trim(),
        productType: form.productType,
        ingredients: form.ingredients.trim(),
        intendedUse: form.intendedUse.trim(),
        description: form.description.trim(),
        market: form.market,
        classification: form.productType === 'Medicine' ? 'Ayurvedic / medicinal product' : 'Ayurveda-Aahar / Wellness Product',
        confidence: 86,
        readiness: 72,
        jurisdiction: form.market === 'International' ? 'International' : 'India',
        createdAt: new Date().toISOString(),
      }

      const existing = JSON.parse(localStorage.getItem(storageKey) ?? '[]') as InnovationRecord[]
      const nextList = [record, ...existing.filter((item) => item.id !== record.id)]
      localStorage.setItem(storageKey, JSON.stringify(nextList))
      localStorage.setItem('ip-sakti-active-innovation', innovationId)
      setIsAnalyzing(false)
      navigate(`/innovation/${innovationId}`)
    }, 1200)
  }

  const stepMeta = [
    { number: 1, label: 'Product type' },
    { number: 2, label: 'Product details' },
    { number: 3, label: 'Target market' },
    { number: 4, label: 'Review' },
  ]

  return (
    <AppShell title="Create Innovation" subtitle="Start a new innovation record">
      <div className="create-innovation-page">
        <section className="create-innovation-hero">
          <div className="create-innovation-hero-copy">
            <div className="eyebrow accent inline-eyebrow">
              <Sparkles size={14} />
              New innovation workspace
            </div>
            <h1>Turn your product idea into a structured IP review.</h1>
            <p>
              Capture the essentials once. MitraAI Sahayak can then route the innovation toward classification,
              IP screening, traditional knowledge, ABS, and regulatory review.
            </p>
          </div>
          <div className="create-innovation-hero-card">
            <FlaskConical size={22} />
            <span>Guided intake</span>
            <strong>4 simple steps</strong>
            <small>About 2–3 minutes to complete</small>
          </div>
        </section>

        <section className="create-innovation-layout">
          <aside className="create-innovation-progress card-block">
            <p className="eyebrow">Your progress</p>
            <div className="progress-steps">
              {stepMeta.map((item) => {
                const complete = item.number < step
                const current = item.number === step
                return (
                  <div key={item.number} className={`progress-step ${current ? 'current' : ''} ${complete ? 'complete' : ''}`}>
                    <div className="progress-step-marker">
                      {complete ? <Check size={15} /> : item.number}
                    </div>
                    <div>
                      <span>Step {item.number}</span>
                      <strong>{item.label}</strong>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="progress-note">
              <CheckCircle2 size={16} />
              <span>Your information stays in this workspace until you submit the innovation.</span>
            </div>
          </aside>

          <section className="create-innovation-card card-block">
            <div className="create-innovation-card-head">
              <div>
                <p className="eyebrow accent">Step {step} of 4</p>
                <h2>
                  {step === 1 && 'What kind of product are you creating?'}
                  {step === 2 && 'Tell us about the product'}
                  {step === 3 && 'Where do you plan to take it?'}
                  {step === 4 && 'Review before analysis'}
                </h2>
                <p>
                  {step === 1 && 'Choose the closest category. You can refine classification later.'}
                  {step === 2 && 'Give the system enough context to build a useful first-pass assessment.'}
                  {step === 3 && 'Market intent helps keep the review aligned with the right jurisdiction.'}
                  {step === 4 && 'Check the details below before creating your innovation record.'}
                </p>
              </div>
              <div className="step-pill">{step}/4</div>
            </div>

            {step === 1 && (
              <div className="product-choice-grid">
                {productTypes.map((type) => {
                  const Icon = productIcons[type.value]
                  const selected = form.productType === type.value
                  return (
                    <button
                      key={type.value}
                      type="button"
                      className={`product-choice ${selected ? 'selected' : ''}`}
                      onClick={() => updateField('productType', type.value)}
                    >
                      <span className="product-choice-icon"><Icon size={20} /></span>
                      <span className="product-choice-copy">
                        <strong>{type.label}</strong>
                        <small>{type.description}</small>
                      </span>
                      <span className="product-choice-check">{selected ? <Check size={15} /> : null}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {step === 2 && (
              <div className="innovation-form-grid">
                <label className="field-block full-width">
                  <span>Product name</span>
                  <input value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Ashwagandha + Brahmi Wellness Capsule" />
                  {errors.name ? <small>{errors.name}</small> : null}
                </label>

                <label className="field-block">
                  <span>Ingredients / materials</span>
                  <textarea value={form.ingredients} onChange={(e) => updateField('ingredients', e.target.value)} placeholder="Withania somnifera extract; Bacopa monnieri extract" rows={5} />
                  {errors.ingredients ? <small>{errors.ingredients}</small> : null}
                </label>

                <label className="field-block">
                  <span>Intended use</span>
                  <textarea value={form.intendedUse} onChange={(e) => updateField('intendedUse', e.target.value)} placeholder="Stress management and cognitive wellness" rows={5} />
                  {errors.intendedUse ? <small>{errors.intendedUse}</small> : null}
                </label>

                <label className="field-block full-width">
                  <span>Product description</span>
                  <textarea value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Describe what makes the product, formulation, process, or experience distinctive." rows={6} />
                  {errors.description ? <small>{errors.description}</small> : null}
                </label>
              </div>
            )}

            {step === 3 && (
              <div className="market-choice-grid">
                {jurisdictions.map((market) => {
                  const selected = form.market === market.value
                  return (
                    <button
                      key={market.value}
                      type="button"
                      className={`market-choice ${selected ? 'selected' : ''}`}
                      onClick={() => updateField('market', market.value)}
                    >
                      <span className="market-choice-dot" />
                      <span>
                        <strong>{market.label}</strong>
                        <small>{market.description}</small>
                      </span>
                      <span className="market-choice-check">{selected ? <Check size={16} /> : null}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {step === 4 && (
              <div className="review-layout">
                <div className="review-summary-card">
                  <div className="review-summary-icon"><Sparkles size={18} /></div>
                  <div>
                    <span>{form.productType}</span>
                    <h3>{form.name || demoInnovation.name}</h3>
                    <p>{form.description || demoInnovation.description}</p>
                  </div>
                </div>

                <div className="review-details-grid">
                  <div><span>Ingredients / materials</span><strong>{form.ingredients || demoInnovation.ingredients}</strong></div>
                  <div><span>Intended use</span><strong>{form.intendedUse || demoInnovation.intendedUse}</strong></div>
                  <div><span>Target market</span><strong>{form.market}</strong></div>
                  <div><span>Review focus</span><strong>Classification, IP, TK, ABS & regulatory</strong></div>
                </div>

                <div className="analysis-note">
                  <CheckCircle2 size={18} />
                  <div>
                    <strong>Ready for first-pass analysis</strong>
                    <span>The next step creates the innovation record and opens its dedicated workspace.</span>
                  </div>
                </div>
              </div>
            )}

            <div className="wizard-actions">
              <button type="button" className="secondary-button" onClick={prevStep} disabled={step === 1}>
                <ArrowLeft size={16} />
                Back
              </button>
              {step < 4 ? (
                <button type="button" className="primary-button" onClick={nextStep}>
                  Continue
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button type="button" className="primary-button" onClick={handleAnalyze} disabled={isAnalyzing}>
                  {isAnalyzing ? (
                    <>
                      <LoaderCircle size={16} className="spinner" />
                      Preparing workspace...
                    </>
                  ) : (
                    <>
                      Analyze innovation
                      <CheckCircle2 size={16} />
                    </>
                  )}
                </button>
              )}
            </div>
          </section>
        </section>
      </div>
    </AppShell>
  )
}
