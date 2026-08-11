const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const { SkuMaster, PurchaseOrder, Grn, Invoice, MatchAudit } = require('./models');
const { parseDocument } = require('./gemini');
const { getMatch, getSummary, resolveSku } = require('./match');

const router = express.Router();

// ─── Multer Setup ───────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: path.join(__dirname, 'uploads'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowed = /pdf|jpg|jpeg|png|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(null, ext || mime);
  },
});

// ─── Auth Middleware ─────────────────────────────────────────────────────────────
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }
  const token = header.split(' ')[1];
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ─── AUTH ────────────────────────────────────────────────────────────────────────
router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;

  // Simple mock auth
  if (email === 'admin@example.com' && password === 'admin123') {
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token, email });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
});

// ─── SKU MASTER CRUD ────────────────────────────────────────────────────────────
router.get('/masters/sku', auth, async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      const regex = new RegExp(search, 'i');
      query = {
        $or: [
          { skuErpCode: regex },
          { name: regex },
          { eanCode: regex },
          { hsnCode: regex },
        ],
      };
    }
    const skus = await SkuMaster.find(query).sort({ createdAt: -1 });
    res.json(skus);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch SKU masters' });
  }
});

router.get('/masters/sku/:id', auth, async (req, res) => {
  try {
    const sku = await SkuMaster.findById(req.params.id);
    if (!sku) return res.status(404).json({ error: 'SKU not found' });
    res.json(sku);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch SKU' });
  }
});

router.post('/masters/sku', auth, async (req, res) => {
  try {
    const { skuErpCode, name, eanCode, hsnCode, uom, agreedRate, mrp, priceTolerance } = req.body;
    if (!skuErpCode || !name) {
      return res.status(400).json({ error: 'skuErpCode and name are required' });
    }
    const existing = await SkuMaster.findOne({ skuErpCode: skuErpCode.trim() });
    if (existing) {
      return res.status(409).json({ error: 'SKU with this ERP code already exists' });
    }
    const sku = await SkuMaster.create({
      skuErpCode: skuErpCode.trim(),
      name: name.trim(),
      eanCode: eanCode || null,
      hsnCode: hsnCode || '',
      uom: uom || '',
      agreedRate: Number(agreedRate) || 0,
      mrp: Number(mrp) || 0,
      priceTolerance: Number(priceTolerance) || 0.05,
    });
    res.status(201).json(sku);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create SKU' });
  }
});

router.patch('/masters/sku/:id', auth, async (req, res) => {
  try {
    const updates = {};
    const allowed = ['skuErpCode', 'name', 'eanCode', 'hsnCode', 'uom', 'agreedRate', 'mrp', 'priceTolerance'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const sku = await SkuMaster.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!sku) return res.status(404).json({ error: 'SKU not found' });
    res.json(sku);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update SKU' });
  }
});

router.delete('/masters/sku/:id', auth, async (req, res) => {
  try {
    const sku = await SkuMaster.findByIdAndDelete(req.params.id);
    if (!sku) return res.status(404).json({ error: 'SKU not found' });
    res.json({ message: 'SKU deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete SKU' });
  }
});

// ─── DOCUMENT UPLOAD ─────────────────────────────────────────────────────────────
router.post('/documents/upload', auth, upload.single('file'), async (req, res) => {
  try {
    const { documentType } = req.body;

    // Validate document type
    if (!['po', 'grn', 'invoice'].includes(documentType)) {
      return res.status(400).json({ error: 'Document type must be po, grn or invoice' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;

    // Step 1: Parse with Gemini
    let parsed;
    try {
     parsed = await parseDocument(filePath, documentType);

// Keep only digits in itemCode
if (parsed && Array.isArray(parsed.items)) {
  parsed.items = parsed.items.map(item => ({
    ...item,
    itemCode: item.itemCode
      ? String(item.itemCode).replace(/\D/g, '')
      : ''
  }));
}

//       console.log("\n========================================");
// console.log("       GEMINI PARSED DOCUMENT JSON");
// console.log("========================================");
// console.log("Document Type:", documentType);
// console.log(JSON.stringify(parsed, null, 2));
// console.log("========================================\n");
    } catch (parseErr) {
      return res.status(422).json({ error: 'Failed to parse document: ' + parseErr.message });
    }

    // Step 2: Validate minimum fields
    if (!parsed) {
      return res.status(422).json({ error: 'Document parsing returned empty or invalid data' });
    }

    let document;
    let duplicateInfo = null;

    if (documentType === 'po') {
      // Validate PO
      if (!parsed.poNumber) {
        return res.status(422).json({ error: 'PO number not found in document' });
      }

      // Check for existing POs with same number BEFORE creating
      const existingPOs = await PurchaseOrder.find({
        poNumber: parsed.poNumber.trim(),
      }).sort({ createdAt: -1 });

      // Resolve SKUs for PO items
      const resolvedItems = [];
      for (const item of (parsed.items || [])) {
        const { skuMaster, warning } = await resolveSku(item.itemCode);
        resolvedItems.push({
          itemCode: item.itemCode || '',
          description: item.description || '',
          quantity: Number(item.quantity) || 0,
          unitRate: Number(item.unitRate) || 0,
          mrp: Number(item.mrp) || 0,
          skuMaster: skuMaster ? skuMaster._id : null,
        });
      }

      document = await PurchaseOrder.create({
        poNumber: parsed.poNumber.trim(),
        poDate: parsed.poDate ? new Date(parsed.poDate) : null,
        vendorName: parsed.vendorName || '',
        items: resolvedItems,
        rawParsed: parsed,
        filePath: req.file.filename,
      });

      // Build duplicate info for response
      if (existingPOs.length > 0) {
        duplicateInfo = {
          isDuplicate: true,
          totalCount: existingPOs.length + 1,
          duplicates: existingPOs.map(po => ({
            id: po._id,
            poNumber: po.poNumber,
            poDate: po.poDate,
            vendorName: po.vendorName,
            itemCount: po.items.length,
            createdAt: po.createdAt,
          })),
        };

        await MatchAudit.findOneAndUpdate(
          { poNumber: parsed.poNumber.trim() },
          { $push: { steps: { status: 'duplicate_po', reasons: ['duplicate_po'], timestamp: new Date() } } },
          { upsert: true }
        );
      }
    }

    if (documentType === 'grn') {
      if (!parsed.grnNumber) {
        return res.status(422).json({ error: 'GRN number not found in document' });
      }
      if (!parsed.poNumber) {
        return res.status(422).json({ error: 'PO number not found in GRN document' });
      }

      const resolvedItems = [];
      for (const item of (parsed.items || [])) {
        const { skuMaster, warning } = await resolveSku(item.itemCode);
        resolvedItems.push({
          itemCode: item.itemCode || '',
          description: item.description || '',
          receivedQuantity: Number(item.receivedQuantity) || 0,
          mrp: Number(item.mrp) || 0,
          skuMaster: skuMaster ? skuMaster._id : null,
        });
      }

      document = await Grn.create({
        grnNumber: parsed.grnNumber.trim(),
        poNumber: parsed.poNumber.trim(),
        grnDate: parsed.grnDate ? new Date(parsed.grnDate) : null,
        items: resolvedItems,
        rawParsed: parsed,
        filePath: req.file.filename,
      });

      // Duplicate check
      const existingGrn = await Grn.findOne({
        grnNumber: parsed.grnNumber.trim(),
        poNumber: parsed.poNumber.trim(),
        _id: { $ne: document._id },
      });
      if (existingGrn) {
        await MatchAudit.findOneAndUpdate(
          { poNumber: parsed.poNumber.trim() },
          { $push: { steps: { status: 'duplicate_document', reasons: ['duplicate_document'], timestamp: new Date() } } },
          { upsert: true }
        );
      }
    }

    if (documentType === 'invoice') {
      if (!parsed.invoiceNumber) {
        return res.status(422).json({ error: 'Invoice number not found in document' });
      }
      if (!parsed.poNumber) {
        return res.status(422).json({ error: 'PO number not found in invoice document' });
      }

      const resolvedItems = [];
      for (const item of (parsed.items || [])) {
        const { skuMaster, warning } = await resolveSku(item.itemCode);
        resolvedItems.push({
          itemCode: item.itemCode || '',
          description: item.description || '',
          quantity: Number(item.quantity) || 0,
          unitRate: Number(item.unitRate) || 0,
          mrp: Number(item.mrp) || 0,
          skuMaster: skuMaster ? skuMaster._id : null,
        });
      }

      document = await Invoice.create({
        invoiceNumber: parsed.invoiceNumber.trim(),
        poNumber: parsed.poNumber.trim(),
        invoiceDate: parsed.invoiceDate ? new Date(parsed.invoiceDate) : null,
        items: resolvedItems,
        rawParsed: parsed,
        filePath: req.file.filename,
      });

      // Duplicate check
      const existingInv = await Invoice.findOne({
        invoiceNumber: parsed.invoiceNumber.trim(),
        poNumber: parsed.poNumber.trim(),
        _id: { $ne: document._id },
      });
      if (existingInv) {
        await MatchAudit.findOneAndUpdate(
          { poNumber: parsed.poNumber.trim() },
          { $push: { steps: { status: 'duplicate_document', reasons: ['duplicate_document'], timestamp: new Date() } } },
          { upsert: true }
        );
      }
    }

    const response = document.toObject();
    if (duplicateInfo) {
      response.duplicateInfo = duplicateInfo;
    }
    res.status(201).json(response);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Document upload failed: ' + err.message });
  }
});

// ─── DOCUMENTS ──────────────────────────────────────────────────────────────────
router.get('/documents', auth, async (req, res) => {
  try {
    const { type } = req.query;
    let docs = [];

    if (!type || type === 'po') {
      const pos = await PurchaseOrder.find().sort({ createdAt: -1 }).populate('items.skuMaster');
      docs.push(...pos.map(d => ({ ...d.toObject(), documentType: 'po' })));
    }
    if (!type || type === 'grn') {
      const grns = await Grn.find().sort({ createdAt: -1 }).populate('items.skuMaster');
      docs.push(...grns.map(d => ({ ...d.toObject(), documentType: 'grn' })));
    }
    if (!type || type === 'invoice') {
      const invoices = await Invoice.find().sort({ createdAt: -1 }).populate('items.skuMaster');
      docs.push(...invoices.map(d => ({ ...d.toObject(), documentType: 'invoice' })));
    }

    docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

router.get('/documents/:id', auth, async (req, res) => {
  try {
    let doc = await PurchaseOrder.findById(req.params.id).populate('items.skuMaster');
    if (doc) return res.json({ ...doc.toObject(), documentType: 'po' });

    doc = await Grn.findById(req.params.id).populate('items.skuMaster');
    if (doc) return res.json({ ...doc.toObject(), documentType: 'grn' });

    doc = await Invoice.findById(req.params.id).populate('items.skuMaster');
    if (doc) return res.json({ ...doc.toObject(), documentType: 'invoice' });

    return res.status(404).json({ error: 'Document not found' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// Serve uploaded file
router.get('/documents/:id/file', auth, async (req, res) => {
  try {
    let doc = await PurchaseOrder.findById(req.params.id);
    if (!doc) doc = await Grn.findById(req.params.id);
    if (!doc) doc = await Invoice.findById(req.params.id);
    if (!doc || !doc.filePath) return res.status(404).json({ error: 'File not found' });

    const filePath = path.join(__dirname, 'uploads', doc.filePath);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on disk' });

    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

// ─── MATCH ──────────────────────────────────────────────────────────────────────
router.get('/match/:poNumber', auth, async (req, res) => {
  try {
    const result = await getMatch(req.params.poNumber);
    res.json(result);
  } catch (err) {
    console.error('Match error:', err);
    res.status(500).json({ error: 'Failed to compute match' });
  }
});

// ─── SUMMARY ────────────────────────────────────────────────────────────────────
router.get('/summary/:poNumber', auth, async (req, res) => {
  try {
    const result = await getSummary(req.params.poNumber);
    res.json(result);
  } catch (err) {
    console.error('Summary error:', err);
    res.status(500).json({ error: 'Failed to compute summary' });
  }
});

module.exports = router;
