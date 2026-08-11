# Finifi Match - Three-Way Match Engine

A full-stack application for **three-way matching** of Purchase Orders (PO), Goods Receipt Notes (GRN), and Invoices. Upload document PDFs/images, let Gemini AI extract structured data, and automatically match quantities, prices, and dates across all three document types.

## Features

### Document Upload and AI Parsing
- Upload PDF, JPG, JPEG, PNG, or WEBP files
- Gemini AI (Google Generative AI) automatically extracts structured data from documents
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
- `matched` - All three documents present, no issues found
- `partially_matched` - Soft warnings only (price mismatch, unmapped SKU)
- `mismatch` - Hard violations (quantity exceeded, date wrong, duplicate, missing item)
- `insufficient_documents` - Not all three documents uploaded yet

### Duplicate Detection
- Duplicate PO (same poNumber): Detected with count and list of existing duplicates
- Duplicate GRN (same grnNumber + poNumber): Detected and flagged
- Duplicate Invoice (same invoiceNumber + poNumber): Detected and flagged
- Original documents are never overwritten
- Frontend shows a warning banner with duplicate count and details

### SKU Master Management
- CRUD operations for SKU Master (product catalogue)
- SKU resolution by skuErpCode or eanCode
- Configurable price tolerance per SKU (default 5%)
- Seed data provided from reference PO documents

### Dashboard
- Lists all Purchase Orders with GRN/Invoice counts
- Select a PO to view full match details
- Real-time upload with status feedback

### Dark Mode
- Built-in dark/light theme toggle
- Persisted across sessions

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
└── README.md
```

## Prerequisites

- Node.js v18 or higher
- MongoDB running locally (default port 27017) or a remote connection string
- Google Gemini API Key - get one from Google AI Studio (https://aistudio.google.com/apikey)

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd finifi
```

### 2. Backend Setup

```bash
cd backend
npm install

# Create .env file from template
cp .env.example .env
# Edit .env and add your MongoDB URI, Gemini API key, and JWT secret

# Seed the SKU Master database
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

## Environment Variables

### Backend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/three_way_match |
| GEMINI_API_KEY | Google Gemini API key | - |
| JWT_SECRET | Secret for JWT signing | assignment_secret |

### Frontend (.env.local)

| Variable | Description | Default |
|----------|-------------|---------|
| NEXT_PUBLIC_API_URL | Backend API URL | http://localhost:5000 |

## How It Works

### Document Upload Flow

1. User uploads PDF/image
2. Multer saves file to backend/uploads/
3. Gemini AI extracts structured JSON (poNumber, items, quantities, rates, etc.)
4. Item codes are normalized (non-digit characters removed)
5. SKU Master resolution (skuErpCode -> eanCode -> null)
6. Document saved to MongoDB
7. Duplicate check performed
8. Response returned (with duplicateInfo if applicable)

### Three-Way Matching Logic

1. Load all documents for the given PO number (POs, GRNs, Invoices)
2. Resolve SKUs for all items across all documents
3. Aggregate quantities by SKU across each document type
4. Per-item comparison:
   - Quantity checks (GRN <= PO, Invoice <= GRN, Invoice <= PO)
   - Price check (Invoice rate vs SKU agreed rate within tolerance)
   - MRP check (Invoice/GRN MRP vs SKU MRP within 1%)
   - Missing item detection
5. Determine status based on hard violations vs soft warnings
6. Record audit step in MatchAudit collection

### Duplicate Detection (Upload Time)

- Before creating a PO, the system queries for existing POs with the same poNumber
- If duplicates exist, the response includes:
  - duplicateInfo.isDuplicate: true
  - duplicateInfo.totalCount - total POs with this number (including new one)
  - duplicateInfo.duplicates[] - list of existing POs with date, vendor, item count
- Frontend displays an amber warning banner with this information

### Match Reason Codes

| Code | Type | Description |
|------|------|-------------|
| insufficient_documents | Hard | Not all three documents uploaded |
| duplicate_po | Hard | Multiple POs with same number |
| duplicate_document | Hard | Multiple GRNs or Invoices with same number |
| grn_qty_exceeds_po_qty | Hard | GRN received quantity > PO ordered quantity |
| invoice_qty_exceeds_grn_qty | Hard | Invoice quantity > GRN received quantity |
| invoice_qty_exceeds_po_qty | Hard | Invoice quantity > PO ordered quantity |
| invoice_date_after_po_date | Hard | Invoice date is after PO date |
| item_missing_in_po | Hard | Item exists in GRN/Invoice but not in PO |
| price_mismatch | Soft | Invoice rate outside SKU tolerance range |
| mrp_mismatch | Soft | Invoice/GRN MRP outside SKU MRP tolerance |
| unmapped_master_sku | Soft | Item code not found in SKU Master |

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login and receive JWT token |

### Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/documents/upload | Upload PO, GRN, or Invoice |
| GET | /api/documents | List all documents (optional ?type=po or grn or invoice) |
| GET | /api/documents/:id | Get document by ID |
| GET | /api/documents/:id/file | Download/view original uploaded file |

### Matching

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/match/:poNumber | Get three-way match result for a PO |
| GET | /api/summary/:poNumber | Get summary with totals and pending delivery |

### SKU Master

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/masters/sku | Create a new SKU |
| GET | /api/masters/sku | List SKUs (supports ?search=) |
| GET | /api/masters/sku/:id | Get SKU by ID |
| PATCH | /api/masters/sku/:id | Update SKU |
| DELETE | /api/masters/sku/:id | Delete SKU |

All endpoints except /api/auth/login require Authorization: Bearer token header.

## Login Credentials

| Field | Value |
|-------|-------|
| Email | admin@example.com |
| Password | admin123 |

## Assumptions

- UOM conversion is out of scope - all items are treated as comparable units
- No separate SKU Master file was provided; seed data was derived from the reference PO/GRN/Invoice documents (PO# CI4PO05788)
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

## AI Tools Used

- Gemini API (Google Generative AI) for document OCR and structured data extraction
