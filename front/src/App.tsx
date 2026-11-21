import { useEffect, useMemo, useState } from 'react'
import { calculate } from './mortgage'
import './App.css'

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})
const currencyCents = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const TERMS = [10, 15, 20, 25, 30]

interface FieldProps {
  id: string
  label: string
  value: number
  onChange: (v: number) => void
  prefix?: string
  suffix?: string
  step?: number
  min?: number
  max?: number
}

function NumberField({ id, label, value, onChange, prefix, suffix, step = 1, min = 0, max }: FieldProps) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="input-wrap">
        {prefix && <span className="affix">{prefix}</span>}
        <input
          id={id}
          type="number"
          inputMode="decimal"
          value={Number.isFinite(value) ? value : ''}
          step={step}
          min={min}
          max={max}
          onChange={(e) => {
            const v = e.target.valueAsNumber
            onChange(Number.isFinite(v) ? v : 0)
          }}
        />
        {suffix && <span className="affix">{suffix}</span>}
      </div>
    </div>
  )
}

type Theme = 'system' | 'light' | 'dark'
const THEMES: { value: Theme; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]
const THEME_KEY = 'theme'

function readTheme(): Theme {
  try {
    const t = localStorage.getItem(THEME_KEY)
    return t === 'light' || t === 'dark' ? t : 'system'
  } catch {
    return 'system'
  }
}

function ThemeSwitch() {
  const [theme, setTheme] = useState<Theme>(readTheme)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') delete root.dataset.theme
    else root.dataset.theme = theme
    try {
      if (theme === 'system') localStorage.removeItem(THEME_KEY)
      else localStorage.setItem(THEME_KEY, theme)
    } catch {
      // storage unavailable (e.g. privacy mode) — theme still applies for this session
    }
  }, [theme])

  return (
    <div className="theme-switch" role="radiogroup" aria-label="Color theme">
      {THEMES.map((t) => (
        <button
          key={t.value}
          type="button"
          role="radio"
          aria-checked={theme === t.value}
          className={theme === t.value ? 'active' : ''}
          onClick={() => setTheme(t.value)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

function App() {
  const [homePrice, setHomePrice] = useState(400000)
  const [downPayment, setDownPayment] = useState(80000)
  const [rate, setRate] = useState(6.5)
  const [term, setTerm] = useState(30)
  const [tax, setTax] = useState(4800)
  const [insurance, setInsurance] = useState(1500)
  const [hoa, setHoa] = useState(0)
  const [showSchedule, setShowSchedule] = useState(false)

  const result = useMemo(
    () =>
      calculate({
        homePrice,
        downPayment: Math.min(downPayment, homePrice),
        annualRatePct: rate,
        termYears: term,
        propertyTaxYearly: tax,
        insuranceYearly: insurance,
        hoaMonthly: hoa,
      }),
    [homePrice, downPayment, rate, term, tax, insurance, hoa],
  )

  const downPct = homePrice > 0 ? (downPayment / homePrice) * 100 : 0
  const setDownPct = (pct: number) =>
    setDownPayment(Math.round((homePrice * Math.min(Math.max(pct, 0), 100)) / 100))

  const parts = [
    { key: 'pi', label: 'Principal & interest', value: result.principalAndInterest },
    { key: 'tax', label: 'Property tax', value: result.tax },
    { key: 'ins', label: 'Home insurance', value: result.insurance },
    { key: 'hoa', label: 'HOA fees', value: result.hoa },
  ]
  const total = result.totalMonthly || 1

  const payoff = new Date()
  payoff.setMonth(payoff.getMonth() + term * 12)
  const payoffLabel = payoff.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

  const principalShare = result.totalPaid > 0 ? (result.loanAmount / result.totalPaid) * 100 : 100

  return (
    <div className="page">
      <header className="header">
        <ThemeSwitch />
        <h1>Mortgage Calculator</h1>
        <p>Estimate your monthly payment and see how your loan pays down over time.</p>
      </header>

      <main className="layout">
        <section className="card inputs" aria-labelledby="loan-details">
          <h2 id="loan-details">Loan details</h2>

          <NumberField id="price" label="Home price" prefix="$" step={1000} value={homePrice} onChange={setHomePrice} />

          <div className="row">
            <NumberField
              id="down"
              label="Down payment"
              prefix="$"
              step={1000}
              max={homePrice}
              value={downPayment}
              onChange={setDownPayment}
            />
            <NumberField
              id="down-pct"
              label="Down %"
              suffix="%"
              step={1}
              max={100}
              value={Math.round(downPct * 10) / 10}
              onChange={setDownPct}
            />
          </div>

          <div className="field">
            <label htmlFor="rate">
              Interest rate <span className="hint">{rate.toFixed(2)}%</span>
            </label>
            <input
              id="rate"
              type="range"
              min={0}
              max={15}
              step={0.05}
              value={rate}
              onChange={(e) => setRate(e.target.valueAsNumber)}
            />
          </div>

          <div className="field">
            <span className="label">Loan term</span>
            <div className="segmented" role="radiogroup" aria-label="Loan term">
              {TERMS.map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={term === t}
                  className={term === t ? 'active' : ''}
                  onClick={() => setTerm(t)}
                >
                  {t} yr
                </button>
              ))}
            </div>
          </div>

          <h3>Taxes &amp; fees</h3>
          <div className="row">
            <NumberField id="tax" label="Property tax / yr" prefix="$" step={100} value={tax} onChange={setTax} />
            <NumberField
              id="ins"
              label="Insurance / yr"
              prefix="$"
              step={100}
              value={insurance}
              onChange={setInsurance}
            />
          </div>
          <NumberField id="hoa" label="HOA / month" prefix="$" step={10} value={hoa} onChange={setHoa} />
        </section>

        <section className="results" aria-live="polite">
          <div className="card summary">
            <span className="eyebrow">Estimated monthly payment</span>
            <div className="big">{currencyCents.format(result.totalMonthly)}</div>

            <div className="bar" aria-hidden="true">
              {parts.map((p) =>
                p.value > 0 ? (
                  <span key={p.key} className={`seg seg-${p.key}`} style={{ width: `${(p.value / total) * 100}%` }} />
                ) : null,
              )}
            </div>

            <ul className="breakdown">
              {parts.map((p) => (
                <li key={p.key}>
                  <span className={`dot seg-${p.key}`} />
                  <span className="name">{p.label}</span>
                  <span className="val">{currencyCents.format(p.value)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="stats">
            <div className="card stat">
              <span className="eyebrow">Loan amount</span>
              <strong>{currency.format(result.loanAmount)}</strong>
            </div>
            <div className="card stat">
              <span className="eyebrow">Total interest</span>
              <strong>{currency.format(result.totalInterest)}</strong>
            </div>
            <div className="card stat">
              <span className="eyebrow">Total of payments</span>
              <strong>{currency.format(result.totalPaid)}</strong>
            </div>
            <div className="card stat">
              <span className="eyebrow">Payoff date</span>
              <strong>{payoffLabel}</strong>
            </div>
          </div>

          <div className="card">
            <span className="eyebrow">Principal vs. interest over the loan</span>
            <div className="bar split" aria-hidden="true">
              <span className="seg seg-pi" style={{ width: `${principalShare}%` }} />
              <span className="seg seg-interest" style={{ width: `${100 - principalShare}%` }} />
            </div>
            <div className="legend">
              <span>
                <span className="dot seg-pi" /> Principal {principalShare.toFixed(0)}%
              </span>
              <span>
                <span className="dot seg-interest" /> Interest {(100 - principalShare).toFixed(0)}%
              </span>
            </div>
            {downPct < 20 && result.loanAmount > 0 && (
              <p className="note">
                With less than 20% down, lenders usually require private mortgage insurance (PMI), which is not
                included in this estimate.
              </p>
            )}
          </div>

          <div className="card">
            <button
              type="button"
              className="toggle"
              aria-expanded={showSchedule}
              onClick={() => setShowSchedule((s) => !s)}
            >
              {showSchedule ? 'Hide' : 'Show'} amortization schedule
            </button>
            {showSchedule && (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th>Principal</th>
                      <th>Interest</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.schedule.map((row) => (
                      <tr key={row.year}>
                        <td>{row.year}</td>
                        <td>{currency.format(row.principal)}</td>
                        <td>{currency.format(row.interest)}</td>
                        <td>{currency.format(row.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="footer">Estimates only. Actual rates and payments may vary by lender.</footer>
    </div>
  )
}

export default App
