import { useMemo, useState } from 'react'
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

const TERMS = [10, 15, 20, 30]

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
  hint?: string
}

function NumberField({ id, label, value, onChange, prefix, suffix, step = 1, min = 0, max, hint }: FieldProps) {
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
          onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
        />
        {suffix && <span className="affix">{suffix}</span>}
      </div>
      {hint && <small className="hint">{hint}</small>}
    </div>
  )
}

function App() {
  const [homePrice, setHomePrice] = useState(400000)
  const [downPct, setDownPct] = useState(20)
  const [rate, setRate] = useState(6.5)
  const [term, setTerm] = useState(30)
  const [taxPct, setTaxPct] = useState(1.1)
  const [insurance, setInsurance] = useState(1500)
  const [hoa, setHoa] = useState(0)
  const [showSchedule, setShowSchedule] = useState(false)

  const downPayment = (homePrice * downPct) / 100

  const result = useMemo(
    () =>
      calculate({
        homePrice,
        downPayment,
        annualRatePct: rate,
        termYears: term,
        annualPropertyTax: (homePrice * taxPct) / 100,
        annualInsurance: insurance,
        monthlyHoa: hoa,
      }),
    [homePrice, downPayment, rate, term, taxPct, insurance, hoa],
  )

  const parts = [
    { key: 'pi', label: 'Principal & interest', value: result.monthlyPrincipalInterest },
    { key: 'tax', label: 'Property tax', value: result.monthlyTax },
    { key: 'ins', label: 'Home insurance', value: result.monthlyInsurance },
    { key: 'hoa', label: 'HOA fees', value: result.monthlyHoa },
  ]

  const payoff = new Date()
  payoff.setMonth(payoff.getMonth() + result.payoffMonths)
  const payoffLabel = payoff.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

  return (
    <main className="app">
      <header className="header">
        <div className="logo" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="28" height="28">
            <path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" fill="currentColor" />
          </svg>
        </div>
        <div>
          <h1>Mortgage Calculator</h1>
          <p className="subtitle">Estimate your monthly payment and see how your loan pays down over time.</p>
        </div>
      </header>

      <div className="layout">
        <section className="card inputs" aria-label="Loan details">
          <h2>Loan details</h2>

          <NumberField id="price" label="Home price" prefix="$" value={homePrice} onChange={setHomePrice} step={1000} />

          <div className="field">
            <label htmlFor="down">Down payment</label>
            <div className="split">
              <div className="input-wrap">
                <span className="affix">$</span>
                <input
                  id="down"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={1000}
                  value={Math.round(downPayment)}
                  onChange={(e) => {
                    const amt = Number(e.target.value) || 0
                    setDownPct(homePrice > 0 ? Math.min(100, (amt / homePrice) * 100) : 0)
                  }}
                />
              </div>
              <div className="input-wrap pct">
                <input
                  aria-label="Down payment percent"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  step={0.5}
                  value={Math.round(downPct * 100) / 100}
                  onChange={(e) => setDownPct(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                />
                <span className="affix">%</span>
              </div>
            </div>
            <input
              className="range"
              type="range"
              aria-label="Down payment percent slider"
              min={0}
              max={50}
              step={0.5}
              value={Math.min(downPct, 50)}
              onChange={(e) => setDownPct(Number(e.target.value))}
            />
          </div>

          <NumberField id="rate" label="Interest rate" suffix="%" value={rate} onChange={setRate} step={0.05} max={30} />

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

          <details className="extras" open>
            <summary>Taxes, insurance & HOA</summary>
            <NumberField
              id="tax"
              label="Property tax"
              suffix="% / yr"
              value={taxPct}
              onChange={setTaxPct}
              step={0.05}
              hint={`${currency.format((homePrice * taxPct) / 100)} per year`}
            />
            <NumberField id="ins" label="Home insurance" prefix="$" suffix="/ yr" value={insurance} onChange={setInsurance} step={100} />
            <NumberField id="hoa" label="HOA fees" prefix="$" suffix="/ mo" value={hoa} onChange={setHoa} step={10} />
          </details>
        </section>

        <section className="card results" aria-live="polite" aria-label="Results">
          <div className="total">
            <span className="total-label">Estimated monthly payment</span>
            <span className="total-value">{currencyCents.format(result.monthlyTotal)}</span>
          </div>

          <div className="bar" role="img" aria-label="Monthly payment breakdown">
            {parts.map((p) =>
              p.value > 0 ? (
                <span
                  key={p.key}
                  className={`seg seg-${p.key}`}
                  style={{ flexGrow: p.value }}
                  title={`${p.label}: ${currencyCents.format(p.value)}`}
                />
              ) : null,
            )}
          </div>

          <ul className="legend">
            {parts.map((p) => (
              <li key={p.key}>
                <span className={`dot seg-${p.key}`} />
                <span className="legend-label">{p.label}</span>
                <span className="legend-value">{currencyCents.format(p.value)}</span>
              </li>
            ))}
          </ul>

          <div className="stats">
            <div>
              <span>Loan amount</span>
              <strong>{currency.format(result.loanAmount)}</strong>
            </div>
            <div>
              <span>Total interest</span>
              <strong>{currency.format(result.totalInterest)}</strong>
            </div>
            <div>
              <span>Total of payments</span>
              <strong>{currency.format(result.totalPaid)}</strong>
            </div>
            <div>
              <span>Payoff date</span>
              <strong>{result.payoffMonths > 0 ? payoffLabel : '—'}</strong>
            </div>
          </div>

          {downPct < 20 && result.loanAmount > 0 && (
            <p className="note">
              With less than 20% down, lenders usually require private mortgage insurance (PMI), which is not
              included in this estimate.
            </p>
          )}
        </section>
      </div>

      {result.schedule.length > 0 && (
        <section className="card schedule">
          <button type="button" className="toggle" aria-expanded={showSchedule} onClick={() => setShowSchedule((s) => !s)}>
            {showSchedule ? 'Hide' : 'Show'} amortization schedule
            <span className={`chev ${showSchedule ? 'open' : ''}`} aria-hidden="true">
              ▾
            </span>
          </button>
          {showSchedule && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>Principal</th>
                    <th>Interest</th>
                    <th>Remaining balance</th>
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
        </section>
      )}

      <footer className="footer">Estimates only. Actual rates, taxes and fees vary by lender and location.</footer>
    </main>
  )
}

export default App
