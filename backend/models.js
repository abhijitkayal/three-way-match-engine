const mongoose = require('mongoose');

// SKU Master - central product catalogue
const skuMasterSchema = new mongoose.Schema({
  skuErpCode: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  eanCode: { type: String, default: null, trim: true },
  hsnCode: { type: String, default: '', trim: true },
  uom: { type: String, default: '', trim: true },
  agreedRate: { type: Number, default: 0 },
  mrp: { type: Number, default: 0 },
  priceTolerance: { type: Number, default: 0.05 }, // 5%
}, { timestamps: true });

// Purchase Order
const purchaseOrderSchema = new mongoose.Schema({
  poNumber: { type: String, required: true, trim: true },
  poDate: { type: Date, default: null },
  vendorName: { type: String, default: '', trim: true },
  items: [{
    itemCode: { type: String, default: '', trim: true },
    description: { type: String, default: '' },
    quantity: { type: Number, default: 0 },
    skuMaster: { type: mongoose.Schema.Types.ObjectId, ref: 'SkuMaster', default: null },
  }],
  rawParsed: { type: mongoose.Schema.Types.Mixed, default: null },
  filePath: { type: String, default: '' },
}, { timestamps: true });

// Goods Receipt Note
const grnSchema = new mongoose.Schema({
  grnNumber: { type: String, required: true, trim: true },
  poNumber: { type: String, required: true, trim: true },
  grnDate: { type: Date, default: null },
  items: [{
    itemCode: { type: String, default: '', trim: true },
    description: { type: String, default: '' },
    receivedQuantity: { type: Number, default: 0 },
    mrp: { type: Number, default: 0 },
    skuMaster: { type: mongoose.Schema.Types.ObjectId, ref: 'SkuMaster', default: null },
  }],
  rawParsed: { type: mongoose.Schema.Types.Mixed, default: null },
  filePath: { type: String, default: '' },
}, { timestamps: true });

// Invoice
const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, trim: true },
  poNumber: { type: String, required: true, trim: true },
  invoiceDate: { type: Date, default: null },
  items: [{
    itemCode: { type: String, default: '', trim: true },
    description: { type: String, default: '' },
    quantity: { type: Number, default: 0 },
    unitRate: { type: Number, default: 0 },
    mrp: { type: Number, default: 0 },
    skuMaster: { type: mongoose.Schema.Types.ObjectId, ref: 'SkuMaster', default: null },
  }],
  rawParsed: { type: mongoose.Schema.Types.Mixed, default: null },
  filePath: { type: String, default: '' },
}, { timestamps: true });

// Match Audit - stores each match attempt per PO
const matchAuditSchema = new mongoose.Schema({
  poNumber: { type: String, required: true, trim: true },
  steps: [{ type: mongoose.Schema.Types.Mixed }],
}, { timestamps: true });

const SkuMaster = mongoose.model('SkuMaster', skuMasterSchema);
const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);
const Grn = mongoose.model('Grn', grnSchema);
const Invoice = mongoose.model('Invoice', invoiceSchema);
const MatchAudit = mongoose.model('MatchAudit', matchAuditSchema);

module.exports = { SkuMaster, PurchaseOrder, Grn, Invoice, MatchAudit };
