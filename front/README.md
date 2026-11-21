# Mortgage Calculator

A single-page mortgage calculator built with React, TypeScript and Vite.

## Features

- Home price, down payment (as an amount or a percentage, with a slider), interest rate and loan term (10/15/20/30 years)
- Optional property tax, home insurance and HOA fees
- Estimated monthly payment with a color-coded breakdown
- Loan amount, total interest, total of payments and payoff date
- PMI reminder when the down payment is under 20%
- Year-by-year amortization schedule
- Responsive layout with light and dark themes

The calculation logic is in `src/mortgage.ts` and uses the standard fixed-rate amortization formula
`M = P · r / (1 − (1 + r)^−n)`, where `r` is the monthly rate and `n` is the number of monthly payments.

## Development

```sh
npm ci
npm run dev     # start dev server
npm run build   # type-check and build to dist/
npm run lint    # oxlint
```

The production image (`Dockerfile`) builds the app and serves `dist/` with nginx.
