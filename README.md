# Timesheet Invoice Generator

A professional web application for generating invoices from timesheet images. Built with Next.js 14, TypeScript, Tailwind CSS, and Tesseract.js for OCR.

## Features

- 📸 **Upload Timesheet Images** - Drag & drop or click to upload timesheet photos
- 🔍 **Automatic OCR** - Extracts shift dates, start/end times automatically using Tesseract.js
- ✏️ **Manual Editing** - Review and edit all extracted data before generating invoice
- 📊 **Overtime Calculation** - Automatic OT calculation for hours beyond 10hrs @ £14/hr
- 📄 **PDF Export** - Generate professional PDF invoices
- 📗 **Excel Export** - Generate Excel spreadsheets for record keeping
- 🎨 **Professional Design** - Royal blue themed invoice matching your branding

## Pre-configured Details

The application comes pre-configured with:

**Your Details:**
- Name: AHMED WAQAS
- Address: 103 Apple Tree Ave, Uxbridge, UB8 3PX
- Phone: 07429175660
- Email: vickycbr8@gmail.com
- UTR: 7038050927

**Client:**
- Heathrow Freight Services Ltd
- 202 Parlaunt Road, Slough, SL3 8AZ

**Rates:**
- Daily Rate: £140 (covers first 10 hours)
- Overtime: £14/hr (for hours beyond 10)

## Deployment to Vercel via StackBlitz

### Method 1: StackBlitz (Recommended)

1. Go to [StackBlitz](https://stackblitz.com/)
2. Click "Start a new project" → "Upload"
3. Upload the entire `timesheet-invoice-app` folder
4. Wait for dependencies to install
5. Click the "Deploy" button in StackBlitz
6. Connect your Vercel account
7. Deploy!

### Method 2: Direct Vercel Deployment

1. Push the code to a GitHub repository
2. Go to [Vercel](https://vercel.com/)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect Next.js settings
6. Click "Deploy"

### Method 3: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to project
cd timesheet-invoice-app

# Deploy
vercel
```

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## Project Structure

```
timesheet-invoice-app/
├── src/
│   ├── app/
│   │   ├── globals.css      # Global styles
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Main page component
│   ├── components/
│   │   ├── FileUploader.tsx # Drag & drop upload
│   │   ├── ShiftEditor.tsx  # Edit shift data
│   │   ├── InvoicePreview.tsx # Live preview
│   │   └── InvoiceSettings.tsx # Invoice number/date
│   └── lib/
│       ├── types.ts         # TypeScript types & constants
│       ├── calculations.ts  # Business logic
│       ├── ocr-parser.ts    # OCR text parsing
│       ├── pdf-generator.ts # PDF generation
│       └── excel-generator.ts # Excel generation
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## Customization

### Change Your Details
Edit `src/lib/types.ts`:

```typescript
export const COMPANY_DETAILS: CompanyDetails = {
  name: 'YOUR NAME',
  address: 'Your Address',
  city: 'Your City',
  postcode: 'Your Postcode',
  phone: 'Your Phone',
  email: 'your@email.com',
  utr: 'Your UTR',
};
```

### Change Rates
Edit `src/lib/types.ts`:

```typescript
export const RATES = {
  dailyRate: 140,    // Base daily rate
  otRate: 14,        // Overtime hourly rate
  standardHours: 10, // Hours before OT kicks in
};
```

### Change Colors
Edit `tailwind.config.js` to modify the color scheme.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **OCR**: Tesseract.js
- **PDF**: jsPDF + jspdf-autotable
- **Excel**: SheetJS (xlsx)
- **Icons**: Lucide React

## Browser Support

Works on all modern browsers:
- Chrome (recommended)
- Firefox
- Safari
- Edge

## License

MIT License - Feel free to modify and use as needed.

---

Built with ❤️ for Ahmed Waqas
