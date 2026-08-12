# Finifi Match - Three-Way Match Engine

A full-stack application for **three-way matching** of Purchase Orders (PO), Goods Receipt Notes (GRN), and Invoices. Upload document PDFs/images, let Gemini AI extract structured data, and automatically match quantities, prices, and dates across all three document types.

---

## Features

### Document Upload and AI Parsing
- Upload PDF, JPG, JPEG, PNG, or WEBP files
- Gemini AI (Google Generative AI) automatically extracts structured data from documents
- Extracts item codes, descriptions, quantities, unit rates, MRP, and total amounts
- Supports Purchase Orders, GRNs, and Invoices
- Documents can be uploaded in any order - the match engine recomputes from current data

### Three-Way Matching Engine
The system compares documents across three dimensions:

| Check | Description |
|-------|-------------|
| PO vs GRN | GRN quantity must not exceed PO quantity |
| GRN vs Invoice | Invoice quantity must not exceed GRN quantity |
| PO vs Invoice | Invoice quantity must not exceed PO quantity |
| Date Validation | Invoice date must not be after PO date |
| Price Check | Invoice rate vs SKU agreed rate (within tolerance) |
| MRP Check | Invoice/GRN MRP vs SKU MRP (within 1% tolerance) |
| Missing Items | Items in GRN/Invoice but not in PO |

### Match Statuses
| Status | Description |
|--------|-------------|
| `matched` | All three documents present, no issues found |
| `partially_matched` | Soft warnings only (price mismatch, unmapped SKU) |
| `mismatch` | Hard violations (quantity exceeded, date wrong, duplicate, missing item) |
| `insufficient_documents` | Not all three documents uploaded yet |

### Duplicate Detection
- Duplicate PO (same poNumber): Detected with count and list of existing duplicates
- Duplicate GRN (same grnNumber + poNumber): Detected and flagged
- Duplicate Invoice (same invoiceNumber + poNumber): Detected and flagged
- Original documents are never overwritten
- Frontend shows a warning banner with duplicate count and details

### SKU Master Management
- CRUD operations for SKU Master (product catalogue)
- SKU resolution by skuErpCode or eanCode
- Invoice items matched to SKU via eanCode lookup
- Configurable price tolerance per SKU (default 5%)
- Seed data provided from reference PO documents

### Summary Dashboard
- PO total amount, invoice amount, and quantity summaries
- Fulfillment progress bar with percentage
- Three-way match result cards (PO vs GRN, PO vs Invoice, GRN vs Invoice)
- Associated Invoice & GRN timeline
- SKU-level match details with variance highlighting

### Dark Mode
- Built-in dark/light theme toggle
- Persisted across sessions
- Consistent color palette (zinc-based) across all components

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose ODM |
| AI Parsing | Google Gemini API (gemini-3.6-flash) |
| File Upload | Multer |
| Authentication | JWT (JSON Web Tokens) |
| Frontend | Next.js 15 (App Router), React 19 |
| Styling | Tailwind CSS 4 |
| UI Components | Shadcn UI, Lucide Icons |
| Charts | Recharts |
| Tables | TanStack Table |

---

## Project Structure

```
finifi/
├── backend/
│   ├── server.js              # Express server, MongoDB connection, static files
│   ├── models.js              # Mongoose schemas (SkuMaster, PO, GRN, Invoice, MatchAudit)
│   ├── routes.js              # All API routes (auth, upload, CRUD, match, summary)
│   ├── match.js               # Three-way matching logic + SKU resolution
│   ├── gemini.js              # Gemini API prompts and document parsing
│   ├── seed.js                # SKU Master seed data (35 SKUs)
│   ├── package.json
│   ├── .env                   # Environment variables (not committed)
│   └── uploads/               # Uploaded PDF/image files
│
├── frontend/
│   ├── app/
│   │   ├── page.jsx           # Root redirect to /login
│   │   ├── layout.jsx         # Root layout with providers
│   │   ├── globals.css        # Tailwind imports
│   │   ├── login/page.jsx     # Login page
│   │   ├── dashboard/page.jsx # Dashboard with PO list + upload
│   │   ├── documents/         # Document list and detail views
│   │   ├── match/             # Match detail views per PO
│   │   └── sku-master/        # SKU Master CRUD page
│   ├── components/
│   │   ├── Upload.jsx         # Document upload with duplicate detection
│   │   ├── Navbar.jsx         # Navigation bar
│   │   ├── ItemTable.jsx      # Item comparison table with mismatch highlighting
│   │   ├── app-sidebar.jsx    # Sidebar navigation
│   │   ├── site-header.jsx    # Header with theme toggle
│   │   ├── theme-provider.jsx # Dark mode context
│   │   ├── match/
│   │   │   ├── FulfillmentItemsTable.jsx  # Invoice items with ERP code lookup
│   │   │   ├── ComparisonTable.jsx        # Side-by-side document comparison
│   │   │   ├── POView.jsx                 # Purchase Order detail view
│   │   │   ├── InvoiceView.jsx            # Invoice detail view
│   │   │   ├── GrnView.jsx                # GRN detail view
│   │   │   └── StatusBadge.jsx            # Match status badges
│   │   ├── summary/
│   │   │   └── SummaryTab.jsx             # Full summary with three-way match
│   │   ├── sku/
│   │   │   └── SkuMasterPage.jsx          # SKU Master CRUD interface
│   │   └── ui/                # Shadcn UI primitives
│   ├── lib/
│   │   ├── api.js             # Central fetch helper with JWT auth
│   │   ├── constants.js       # Reason labels, formatters
│   │   └── utils.js           # General utilities
│   ├── package.json
│   └── .env.local             # Frontend env vars (not committed)
│
├── .env.example               # Template for environment variables
├── postman_collection.json    # Postman collection for API testing
├── render.yaml                # Render.com deployment config
└── README.md
```

---

## Prerequisites

- **Node.js** v18 or higher
- **MongoDB** running locally (default port 27017) or a remote connection string
- **Google Gemini API Key** - get one from [Google AI Studio](https://aistudio.google.com/apikey)

---

## Installation

### 1. Clone the repository

```bash
git clone <https://github.com/abhijitkayal/three-way-match-engine>
```

### 2. Backend Setup

```bash
cd backend
npm install

# Create .env file from template
cp .env.example .env

# Edit .env and add your values:
#   MONGODB_URI=mongodb://localhost:27017/three_way_match
#   GEMINI_API_KEY=your_gemini_api_key
#   JWT_SECRET=your_secret_key

# Seed the SKU Master database (optional - adds 35 sample SKUs)
npm run seed

# Start the backend server (port 5000)
npm start
```

### 3. Frontend Setup

```bash
cd frontend
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local

# Start the dev server (port 3000)
npm run dev
```

### 4. Open in Browser

Navigate to http://localhost:3000 and log in.

---

## Environment Variables

### Backend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/three_way_match` |
| `GEMINI_API_KEY` | Google Gemini API key | - |
| `JWT_SECRET` | Secret for JWT signing | `assignment_secret` |

### Frontend (.env.local)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:5000` |

---

## How It Works

### Document Upload Flow

```
User uploads PDF/image
        ↓
Multer saves file to backend/uploads/
        ↓
Gemini AI extracts structured JSON
(pNumber, items, quantities, rates, MRP, totalAmount)
        ↓
SKU Master resolution (eanCode → skuErpCode)
        ↓
Document saved to MongoDB
        ↓
Duplicate check performed
        ↓
Response returned (with duplicateInfo if applicable)
```

### Three-Way Matching Logic

```
Load all documents for the given PO number
        ↓
Resolve SKUs for all items across all documents
        ↓
Aggregate quantities by SKU across each document type
        ↓
Per-item comparison:
  • Quantity checks (GRN ≤ PO, Invoice ≤ GRN, Invoice ≤ PO)
  • Price check (Invoice rate vs SKU agreed rate within tolerance)
  • MRP check (Invoice/GRN MRP vs SKU MRP within 1%)
  • Missing item detection
        ↓
Determine status based on hard violations vs soft warnings
        ↓
Record audit step in MatchAudit collection
```

### SKU Resolution

Invoice items are matched to SKU Master using the **eanCode** field:

1. Invoice `itemCode` is compared against SKU Master `eanCode`
2. If match found, the SKU's `skuErpCode` is used for PO/GRN matching
3. If no match, item is flagged as "Not found in PO"

---

## Match Reason Codes

| Code | Type | Description |
|------|------|-------------|
| `insufficient_documents` | Hard | Not all three documents uploaded |
| `duplicate_po` | Hard | Multiple POs with same number |
| `duplicate_document` | Hard | Multiple GRNs or Invoices with same number |
| `grn_qty_exceeds_po_qty` | Hard | GRN received quantity > PO ordered quantity |
| `invoice_qty_exceeds_grn_qty` | Hard | Invoice quantity > GRN received quantity |
| `invoice_qty_exceeds_po_qty` | Hard | Invoice quantity > PO ordered quantity |
| `invoice_date_after_po_date` | Hard | Invoice date is after PO date |
| `item_missing_in_po` | Hard | Item exists in GRN/Invoice but not in PO |
| `price_mismatch` | Soft | Invoice rate outside SKU tolerance range |
| `mrp_mismatch` | Soft | Invoice/GRN MRP outside SKU MRP tolerance |
| `unmapped_master_sku` | Soft | Item code not found in SKU Master |

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login and receive JWT token |

### Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents/upload` | Upload PO, GRN, or Invoice |
| GET | `/api/documents` | List all documents (optional `?type=po\|grn\|invoice`) |
| GET | `/api/documents/:id` | Get document by ID |
| GET | `/api/documents/:id/file` | Download/view original uploaded file |

### Matching

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/match/:poNumber` | Get three-way match result for a PO |
| GET | `/api/summary/:poNumber` | Get summary with totals and pending delivery |

### SKU Master

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/masters/sku` | Create a new SKU |
| GET | `/api/masters/sku` | List SKUs (supports `?search=`) |
| GET | `/api/masters/sku/:id` | Get SKU by ID |
| PATCH | `/api/masters/sku/:id` | Update SKU |
| DELETE | `/api/masters/sku/:id` | Delete SKU |

> All endpoints except `/api/auth/login` require `Authorization: Bearer <token>` header.

---

## Login Credentials

| Field | Value |
|-------|-------|
| Email | `admin@example.com` |
| Password | `admin123` |

---

## Deployment

### Render.com

The project includes a `render.yaml` for easy deployment:

1. Push to GitHub
2. Create a new Render Blueprint from the repo
3. Set environment variables in Render dashboard:
   - `MONGODB_URI` (use MongoDB Atlas or Render managed MongoDB)
   - `GEMINI_API_KEY`
   - `JWT_SECRET`
4. Deploy

### Manual Deployment

**Backend:**
```bash
cd backend
npm install --production
NODE_ENV=production node server.js
```

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

---

## Assumptions

- UOM conversion is out of scope - all items are treated as comparable units
- No separate SKU Master file was provided; seed data was derived from reference PO/GRN/Invoice documents
- Gemini API is used for OCR/parsing (requires a valid API key with Generative AI access)
- MongoDB must be running locally on the default port, or a valid remote URI must be provided
- Local file storage is used for uploads (no cloud storage)

## Limitations

- No background processing (uploads are synchronous)
- No bulk upload capability
- No advanced search or filtering
- No user roles or permissions (single admin user)
- Single-tenant design
- No PDF/image preview in the browser (file download only)

---

## License

This project is for internal use only.
