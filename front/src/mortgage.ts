export interface MortgageInput {
  homePrice: number
  downPayment: number
  annualRatePct: number
  termYears: number
  propertyTaxYearly: number
  insuranceYearly: number
  hoaMonthly: number
}

export interface YearRow {
  year: number
  principal: number
  interest: number
  balance: number
}

export interface MortgageResult {
  loanAmount: number
  principalAndInterest: number
  tax: number
  insurance: number
  hoa: number
  totalMonthly: number
  totalInterest: number
  totalPaid: number
  schedule: YearRow[]
}

/** Standard fixed-rate monthly payment (principal + interest). */
export function monthlyPayment(principal: number, annualRatePct: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0
  const r = annualRatePct / 100 / 12
  if (r === 0) return principal / months
  return (principal * r) / (1 - Math.pow(1 + r, -months))
}

export function calculate(input: MortgageInput): MortgageResult {
  const loanAmount = Math.max(0, input.homePrice - input.downPayment)
  const months = Math.round(Math.max(0, input.termYears) * 12)
  const r = Math.max(0, input.annualRatePct) / 100 / 12
  const pi = monthlyPayment(loanAmount, Math.max(0, input.annualRatePct), months)

  const schedule: YearRow[] = []
  let balance = loanAmount
  let totalInterest = 0
  let yearPrincipal = 0
  let yearInterest = 0
  for (let m = 1; m <= months; m++) {
    const interest = balance * r
    const principal = Math.min(pi - interest, balance)
    balance -= principal
    yearPrincipal += principal
    yearInterest += interest
    totalInterest += interest
    if (m % 12 === 0 || m === months) {
      schedule.push({
        year: Math.ceil(m / 12),
        principal: yearPrincipal,
        interest: yearInterest,
        balance: Math.max(0, balance),
      })
      yearPrincipal = 0
      yearInterest = 0
    }
  }

  const tax = Math.max(0, input.propertyTaxYearly) / 12
  const insurance = Math.max(0, input.insuranceYearly) / 12
  const hoa = Math.max(0, input.hoaMonthly)

  return {
    loanAmount,
    principalAndInterest: pi,
    tax,
    insurance,
    hoa,
    totalMonthly: pi + tax + insurance + hoa,
    totalInterest,
    totalPaid: loanAmount + totalInterest,
    schedule,
  }
}
