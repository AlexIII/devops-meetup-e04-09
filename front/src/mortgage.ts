export interface MortgageInput {
  homePrice: number
  downPayment: number
  annualRatePct: number
  termYears: number
  annualPropertyTax: number
  annualInsurance: number
  monthlyHoa: number
}

export interface YearRow {
  year: number
  principal: number
  interest: number
  balance: number
}

export interface MortgageResult {
  loanAmount: number
  monthlyPrincipalInterest: number
  monthlyTax: number
  monthlyInsurance: number
  monthlyHoa: number
  monthlyTotal: number
  totalInterest: number
  totalPaid: number
  payoffMonths: number
  schedule: YearRow[]
}

const safe = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0)

export function monthlyPayment(principal: number, annualRatePct: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0
  const r = annualRatePct / 100 / 12
  if (r === 0) return principal / months
  return (principal * r) / (1 - Math.pow(1 + r, -months))
}

export function calculate(input: MortgageInput): MortgageResult {
  const homePrice = safe(input.homePrice)
  const down = Math.min(safe(input.downPayment), homePrice)
  const loanAmount = homePrice - down
  const rate = safe(input.annualRatePct)
  const months = Math.round(safe(input.termYears) * 12)

  const pi = monthlyPayment(loanAmount, rate, months)
  const r = rate / 100 / 12

  const schedule: YearRow[] = []
  let balance = loanAmount
  let totalInterest = 0
  let yearPrincipal = 0
  let yearInterest = 0
  let payoffMonths = 0

  for (let m = 1; m <= months && balance > 0.005; m++) {
    const interest = balance * r
    const principal = Math.min(pi - interest, balance)
    balance -= principal
    totalInterest += interest
    yearPrincipal += principal
    yearInterest += interest
    payoffMonths = m
    if (m % 12 === 0 || m === months || balance <= 0.005) {
      schedule.push({
        year: Math.ceil(m / 12),
        principal: yearPrincipal,
        interest: yearInterest,
        balance: Math.max(balance, 0),
      })
      yearPrincipal = 0
      yearInterest = 0
    }
  }

  const monthlyTax = safe(input.annualPropertyTax) / 12
  const monthlyInsurance = safe(input.annualInsurance) / 12
  const monthlyHoa = safe(input.monthlyHoa)

  return {
    loanAmount,
    monthlyPrincipalInterest: pi,
    monthlyTax,
    monthlyInsurance,
    monthlyHoa,
    monthlyTotal: pi + monthlyTax + monthlyInsurance + monthlyHoa,
    totalInterest,
    totalPaid: loanAmount + totalInterest,
    payoffMonths,
    schedule,
  }
}
