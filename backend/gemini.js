const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Prompt for Purchase Order extraction
const PO_PROMPT = `Extract structured data from this Purchase Order image/PDF.
Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "poNumber": "string",
  "poDate": "YYYY-MM-DD or null",
  "vendorName": "string",
  "totalAmount": number,
  "items": [
    {
      "itemCode": "string (ERP code or SKU code)",
      "description": "string (product name)",
      "quantity": number,
      "unitRate": number,
      "mrp": number
    }
  ]
}
Rules:
- itemCode should be the ERP code / item code / SKU code from the document
- totalAmount is the total amount of the PO
- If a field is not found, use null or 0
- Extract ALL line items, do not skip any
- Return ONLY the JSON object`;

// Prompt for GRN extraction
const GRN_PROMPT = `Extract structured data from this Goods Receipt Note (GRN) image/PDF.
Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "grnNumber": "string",
  "poNumber": "string",
  "grnDate": "YYYY-MM-DD or null",
  "totalAmount": number,
  "items": [
    {
      "itemCode": "string (ERP code or SKU code)",
      "description": "string (product name)",
      "receivedQuantity": number,
      "unitRate": number,
      "mrp": number
    }
  ]
}
Rules:
- itemCode should be the ERP code / item code / SKU code from the document
- receivedQuantity is the quantity actually received
- unitRate is the unit price per item
- mrp is the maximum retail price if shown
- totalAmount is the total amount of the GRN
- If a field is not found, use null or 0
- Extract ALL line items, do not skip any
- Return ONLY the JSON object`;

// Prompt for Invoice extraction
const INVOICE_PROMPT = `Extract structured data from this Invoice image/PDF.
Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "invoiceNumber": "string",
  "poNumber": "string",
  "invoiceDate": "YYYY-MM-DD or null",
  "totalAmount": number,
  "items": [
    {
      "itemCode": "string (ERP code or SKU code)",
      "description": "string (product name)",
      "quantity": number,
      "unitRate": number,
      "mrp": number
    }
  ]
}
Rules:
- itemCode should be the ERP code / item code / SKU code from the document
- unitRate is the price per unit charged
- mrp is the maximum retail price if shown
- totalAmount is the total amount of the invoice
- If a field is not found, use null or 0
- Extract ALL line items, do not skip any
- Return ONLY the JSON object`;

// const DOCUMENT_PROMPT = `
// Analyze the uploaded document and extract structured data.

// First, identify whether the document is:
// - Purchase Order
// - Goods Receipt Note (GRN)
// - Invoice

// Determine the document type from the content of the document itself.
// Do NOT ask the user to provide the document type.

// Return ONLY valid JSON.
// Do not return markdown, code fences, explanations, or additional text.

// Use this exact structure:

// {
//   "documentType": "po | grn | invoice",
//   "poNumber": "string or null",
//   "grnNumber": "string or null",
//   "invoiceNumber": "string or null",
//   "poDate": "YYYY-MM-DD or null",
//   "grnDate": "YYYY-MM-DD or null",
//   "invoiceDate": "YYYY-MM-DD or null",
//   "vendorName": "string or null",
//   "items": [
//     {
//       "itemCode": "string or null",
//       "description": "string or null",
//       "quantity": number,
//       "receivedQuantity": number,
//       "unitRate": number,
//       "mrp": number
//     }
//   ]
// }

// Rules:

// 1. Detect documentType automatically from the uploaded document.
// 2. If the document is a Purchase Order, set documentType to "po".
// 3. If the document is a Goods Receipt Note, set documentType to "grn".
// 4. If the document is an Invoice, set documentType to "invoice".
// 5. Extract ALL line items. Never skip a line item.
// 6. itemCode must be the ERP code, item code, SKU code, or product code shown in the document.
// 7. Do not invent item codes.
// 8. Preserve the item code exactly as shown in the document.
// 9. For Purchase Orders:
//    - quantity = ordered quantity
//    - unitRate = PO unit price
//    - receivedQuantity = 0
// 10. For GRNs:
//    - receivedQuantity = actually received quantity
//    - quantity = 0
//    - unitRate = 0 unless explicitly shown
// 11. For Invoices:
//    - quantity = invoiced quantity
//    - unitRate = invoice unit price
//    - receivedQuantity = 0
// 12. Extract MRP when available. Otherwise use 0.
// 13. Extract vendorName when available.
// 14. Extract the relevant document number:
//    - PO number for Purchase Orders
//    - GRN number for GRNs
//    - Invoice number for Invoices
// 15. Extract the PO number from GRN and Invoice documents when present.
// 16. If a field does not exist in the document, return null for strings and 0 for numeric fields.
// 17. Do not calculate values that are not explicitly required.
// 18. Return ONLY the JSON object.
// `;

const PROMPTS = {
  po: PO_PROMPT,
  grn: GRN_PROMPT,
  invoice: INVOICE_PROMPT,
};

// Convert file buffer to Gemini inline data format
function fileToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType,
    },
  };
}

// Determine MIME type from file extension
function getMimeType(filename) {
  const ext = filename.toLowerCase().split('.').pop();
  const mimeMap = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
  };
  return mimeMap[ext] || 'application/pdf';
}

// Parse document using Gemini API
// Returns parsed JSON or throws error
async function parseDocument(filePath, documentType) {
  const fs = require('fs');
  const buffer = fs.readFileSync(filePath);
  const mimeType = getMimeType(filePath);
  const prompt = PROMPTS[documentType];

  if (!prompt) {
    throw new Error(`Unknown document type: ${documentType}`);
  }

  const model = genAI.getGenerativeModel({ model:"gemini-3.6-flash" });
  const imagePart = fileToGenerativePart(buffer, mimeType);

  // Try once
  let result = await tryParse(model, prompt, imagePart);

  // If failed, retry once
  if (!result) {
    result = await tryParse(model, prompt, imagePart);
  }

  console.log()
  if (!result) {
    throw new Error('Failed to parse document. Gemini returned invalid JSON after retry.');
  }

  // console.log(result);
  return result;
}

// Single attempt to parse with Gemini
async function tryParse(model, prompt, imagePart) {
  try {
    const response = await model.generateContent([prompt, imagePart]);
    const text = response.response.text();

    // Try to extract JSON from the response
    // Sometimes Gemini wraps JSON in ```json ... ```
    let jsonStr = text.trim();

    // Remove markdown code fences if present
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(jsonStr);

    // Basic validation - must have items array
    if (!parsed || !Array.isArray(parsed.items)) {
      return null;
    }

    return parsed;
  } catch (err) {
    console.error('Gemini parse attempt failed:', err.message);
    return null;
  }
}

module.exports = { parseDocument };
