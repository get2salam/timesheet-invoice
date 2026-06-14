# Timesheet Invoice Generator

Convert timesheets to professional invoices with OCR — upload a photo of your timesheet and get a polished PDF or Excel invoice in seconds.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3-38bdf8?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Features

- 📸 **OCR Parsing** — Upload a timesheet image and automatically extract shift dates, start/end times using Tesseract.js
- ✏️ **Shift Editing** — Review, add, edit, or remove extracted shift data before generating the invoice
- 📄 **PDF Export** — Generate professional, branded PDF invoices ready to send
- 📗 **Excel Export** — Download Excel spreadsheets for bookkeeping and records
- ⏱️ **Overtime Calculation** — Automatic overtime detection and calculation based on configurable thresholds
- ⚙️ **Customizable Settings** — Configure your company details, client info, rates, and invoice numbering
- 🎨 **Professional Design** — Clean, modern UI with a royal-blue themed invoice layout

## Screenshots

> _Screenshots coming soon — run the app locally to see it in action._

## Tech Stack

| Layer       | Technology                          |
| ----------- | ----------------------------------- |
| Framework   | Next.js 14 (App Router)             |
| Language    | TypeScript 5                        |
| Styling     | Tailwind CSS 3                      |
| OCR         | Tesseract.js                        |
| PDF         | jsPDF + jspdf-autotable             |
| Excel       | SheetJS (xlsx)                      |
| Icons       | Lucide React                        |

## Getting Started

### Prerequisites

- **Node.js** 18+ (20 recommended)
- **npm** 9+

### Install & Run

```bash
# Clone the repository
git clone https://github.com/get2salam/timesheet-invoice.git
cd timesheet-invoice

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

### Docker

```bash
# Build and run with Docker Compose
docker compose up --build

# Or build manually
docker build -t timesheet-invoice .
docker run -p 3000:3000 timesheet-invoice
```

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── globals.css          # Global styles
│   │   ├── layout.tsx           # Root layout
│   │   └── page.tsx             # Main page component
│   ├── components/
│   │   ├── FileUploader.tsx     # Drag & drop image upload
│   │   ├── ShiftEditor.tsx      # Shift data table editor
│   │   ├── InvoicePreview.tsx   # Live invoice preview
│   │   └── InvoiceSettings.tsx  # Invoice number & date settings
│   └── lib/
│       ├── types.ts             # TypeScript types & constants
│       ├── calculations.ts      # Business logic (hours, overtime, totals)
│       ├── ocr-parser.ts        # OCR text → structured shift data
│       ├── pdf-generator.ts     # PDF invoice generation
│       └── excel-generator.ts   # Excel export
├── tests/                       # Unit tests (Vitest)
├── Dockerfile                   # Multi-stage production build
├── docker-compose.yml
├── Makefile                     # Common dev commands
└── .github/workflows/ci.yml    # CI pipeline
```

## Configuration

### Company & Client Details

Edit `src/lib/types.ts` to set your company info, client details, and rates:

```typescript
export const COMPANY_DETAILS: CompanyDetails = {
  name: 'Your Company Name',
  address: '123 Business Street',
  city: 'London',
  postcode: 'EC1A 1BB',
  // ...
};

export const RATES = {
  dailyRate: 140,      // Base daily rate
  otRate: 14,          // Overtime hourly rate
  standardHours: 10,   // Hours before overtime kicks in
};
```

### Styling

Modify `tailwind.config.js` to customise the colour scheme and design tokens.

## Development

```bash
make dev          # Start dev server
make build        # Production build
make type-check   # Run TypeScript compiler checks
make lint         # Lint the codebase
make test         # Run unit tests
make verify       # Type-check and run tests (same checks CI runs)
```

### Verifying changes locally

Before opening a pull request, run the same checks CI runs:

```bash
npm run verify
```

This chains `npm run typecheck` and `npm test`, so a clean exit means TypeScript
compiles and all 79 unit tests pass. CI also runs `npm run build` and a Docker
image build on top of these.

### Runnable sample week

Use `examples/sample-week.json` as a copyable fixture for checking invoice math
before wiring in your own timesheet export. It covers a standard 10-hour shift,
one overtime shift, and an overnight shift that crosses midnight:

```bash
npm test -- tests/readme-example.test.ts
```

Expected totals for the sample are:

| Metric | Value |
| --- | ---: |
| Daily total | £420.00 |
| Overtime hours | 2.5 |
| Overtime total | £35.00 |
| Grand total | £455.00 |

The test imports the JSON fixture and runs it through the same calculation
helpers used by the app, so the documented example stays in sync with the code.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
