import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, LoaderCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { demoInnovation } from '../data/mockData'
import type { InnovationRecord, MarketJurisdiction, ProductType } from '../types'

const productTypes: ProductType[] = ['Medicine', 'Wellness Product', 'Food/Nutraceutical', 'Cosmetic', 'Other']
const jurisdictions: MarketJurisdiction[] = ['India', 'International', 'Both']

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

  const isValid = useMemo(() => {
    return Boolean(form.name.trim() && form.ingredients.trim() && form.intendedUse.trim() && form.description.trim())
  }, [form])

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
    const nextErrors: Record<string, string> = {}

    if (step === 2) {
      if (!form.name.trim()) nextErrors.name = 'Product name is required.'
      if (!form.ingredients.trim()) nextErrors.ingredients = 'Ingredients are required.'
      if (!form.intendedUse.trim()) nextErrors.intendedUse = 'Intended use is required.'
      if (!form.description.trim()) nextErrors.description = 'Product description is required.'
    }

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
    if (!isValid && !validateStep()) return
    setIsAnalyzing(true)

    setTimeout(() => {
      const innovationId = `INV-${Date.now().toString(36).toUpperCase()}`
      const record: InnovationRecord = {
        id: innovationId,
        name: form.name.trim() || demoInnovation.name,
        productType: form.productType,
        ingredients: form.ingredients.trim(),
        intendedUse: form.intendedUse.trim(),
        description: form.description.trim(),
        market: form.market,
        classification: 'Ayurveda-Aahar / Wellness Product',
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

  return (
    <AppShell title="Create Innovation" subtitle="Prototype wizard">
      <div className="page-grid narrow-layout">
        <section className="card-block wizard-card">
          <div className="wizard-head">
            <div>
              <p className="eyebrow accent">Create Innovation</p>
              <h2>New product intake</h2>
            </div>
            <div className="step-indicator">Step {step} / 4</div>
          </div>

          {step === 1 && (
            <div className="wizard-step">
              <h3>Step 1: Product Type</h3>
              <div className="option-grid">
                {productTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`option-card ${form.productType === type ? 'selected' : ''}`}
                    onClick={() => updateField('productType', type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="wizard-step form-grid">
              <h3>Step 2: Fields</h3>
              <label className="field-block">
                <span>Product Name</span>
                <input value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Ashwagandha + Brahmi Wellness Capsule" />
                {errors.name ? <small>{errors.name}</small> : null}
              </label>
              <label className="field-block">
                <span>Ingredients</span>
                <textarea value={form.ingredients} onChange={(e) => updateField('ingredients', e.target.value)} placeholder="Withania somnifera extract; Bacopa monnieri extract" rows={3} />
                {errors.ingredients ? <small>{errors.ingredients}</small> : null}
              </label>
              <label className="field-block">
                <span>Intended Use</span>
                <input value={form.intendedUse} onChange={(e) => updateField('intendedUse', e.target.value)} placeholder="Stress management and cognitive wellness" />
                {errors.intendedUse ? <small>{errors.intendedUse}</small> : null}
              </label>
              <label className="field-block">
                <span>Product Description</span>
                <textarea value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Wellness-oriented capsule combining standardized botanical extracts." rows={4} />
                {errors.description ? <small>{errors.description}</small> : null}
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="wizard-step">
              <h3>Step 3: Target Market</h3>
              <div className="option-grid">
                {jurisdictions.map((market) => (
                  <button
                    key={market}
                    type="button"
                    className={`option-card ${form.market === market ? 'selected' : ''}`}
                    onClick={() => updateField('market', market)}
                  >
                    {market}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="wizard-step summary-step">
              <h3>Step 4: Review</h3>
              <div className="review-grid">
                <div><span>Product Type</span><strong>{form.productType}</strong></div>
                <div><span>Product Name</span><strong>{form.name || demoInnovation.name}</strong></div>
                <div><span>Ingredients</span><strong>{form.ingredients || demoInnovation.ingredients}</strong></div>
                <div><span>Intended Use</span><strong>{form.intendedUse || demoInnovation.intendedUse}</strong></div>
                <div><span>Target Market</span><strong>{form.market}</strong></div>
                <div><span>Description</span><strong>{form.description || demoInnovation.description}</strong></div>
              </div>
            </div>
          )}

          <div className="wizard-actions">
            <button type="button" className="secondary-button" onClick={prevStep} disabled={step === 1}>
              Back
            </button>
            {step < 4 ? (
              <button type="button" className="primary-button" onClick={nextStep}>
                Continue <ArrowRight size={16} />
              </button>
            ) : (
              <button type="button" className="primary-button" onClick={handleAnalyze} disabled={isAnalyzing}>
                {isAnalyzing ? <><LoaderCircle size={16} className="spinner" /> Analyzing...</> : <>Analyze Innovation <CheckCircle2 size={16} /></>}
              </button>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
