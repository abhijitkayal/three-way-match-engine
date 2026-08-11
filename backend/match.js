const { SkuMaster, PurchaseOrder, Grn, Invoice, MatchAudit } = require('./models');

// Resolve SKU for a single item code
// Resolution order: skuErpCode → eanCode → null (unresolved)
async function resolveSku(itemCode) {
  if (!itemCode) return { skuMaster: null, warning: 'unmapped_master_sku' };

  const code = String(itemCode).trim().toLowerCase();

  // Try skuErpCode first
  let sku = await SkuMaster.findOne({ skuErpCode: { $regex: new RegExp(`^${escapeRegex(code)}$`, 'i') } });
  if (sku) return { skuMaster: sku, warning: null };

  // Try eanCode
  sku = await SkuMaster.findOne({ eanCode: { $regex: new RegExp(`^${escapeRegex(code)}$`, 'i') } });
  if (sku) return { skuMaster: sku, warning: null };

  // Unresolved
  return { skuMaster: null, warning: 'unmapped_master_sku' };
}

// Escape special regex characters
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function resolveAndSaveDocumentItems(document, codeField = 'itemCode') {
  if (!document || !Array.isArray(document.items)) {
    return [];
  }

  for (const item of document.items) {
    const { skuMaster, warning } = await resolveSku(item[codeField]);

    item.skuMaster = skuMaster ? skuMaster._id : null;
    item.skuName = skuMaster ? skuMaster.name : null;
    item.warning = warning;
  }

  await document.save();

  return document.items;
}

// Same as above but does NOT save the document (read-only resolution)
async function resolveDocumentItems(document, codeField = 'itemCode') {
  if (!document || !Array.isArray(document.items)) {
    return [];
  }

  for (const item of document.items) {
    const { skuMaster, warning } = await resolveSku(item[codeField]);

    item.skuMaster = skuMaster ? skuMaster._id : null;
    item.skuName = skuMaster ? skuMaster.name : null;
    item.warning = warning;
  }

  return document.items;
}

// Check if a value is a "hard violation" reason code
function isHardViolation(reason) {
  return [
    'grn_qty_exceeds_po_qty',
    'invoice_qty_exceeds_grn_qty',
    'invoice_qty_exceeds_po_qty',
    'invoice_date_after_po_date',
    'duplicate_po',
    'duplicate_document',
    'item_missing_in_po',
  ].includes(reason);
}

// Main match function - recomputes every time from current DB data
async function getMatch(poNumber) {
  const reasons = [];

  // 1. Find all POs for this number
  const pos = await PurchaseOrder.find({ poNumber }).sort({ createdAt: 1 }).populate('items.skuMaster');

  // 2. Find all GRNs for this PO
  const grns = await Grn.find({ poNumber }).sort({ createdAt: 1 }).populate('items.skuMaster');

  // 3. Find all Invoices for this PO
  const invoices = await Invoice.find({ poNumber }).sort({ createdAt: 1 }).populate('items.skuMaster');

  // Check for duplicate PO
  if (pos.length > 1) {
    reasons.push('duplicate_po');
  }

  // Check for duplicate GRN/Invoice
  const grnNumbers = grns.map(g => g.grnNumber);
  const invoiceNumbers = invoices.map(i => i.invoiceNumber);
  if (new Set(grnNumbers).size < grnNumbers.length) reasons.push('duplicate_document');
  if (new Set(invoiceNumbers).size < invoiceNumbers.length) reasons.push('duplicate_document');

  // Determine overall document completeness
  const hasPO = pos.length > 0;
  const hasGRN = grns.length > 0;
  const hasInvoice = invoices.length > 0;

  if (!hasPO || !hasGRN || !hasInvoice) {
    reasons.push('insufficient_documents');
  }

  // Use the first PO as the primary PO
  const primaryPO = pos[0] || null;
  const poDate = primaryPO?.poDate ? new Date(primaryPO.poDate) : null;
  const invoiceDate = invoices.length > 0 && invoices[0].invoiceDate
    ? new Date(invoices[0].invoiceDate)
    : null;

  // Date check
  if (poDate && invoiceDate && invoiceDate > poDate) {
    reasons.push('invoice_date_after_po_date');
  }

  // Resolve PO SKU mappings (read-only, don't overwrite document)
  const poItems = primaryPO
    ? await resolveDocumentItems(primaryPO)
    : [];

// Resolve GRN SKU mappings (read-only)
const allGrnItems = [];

for (const grn of grns) {
  const resolved = await resolveDocumentItems(grn);
  allGrnItems.push(...resolved);
}

// Resolve Invoice SKU mappings (read-only)
const allInvoiceItems = [];

for (const inv of invoices) {
  const resolved = await resolveDocumentItems(inv);
  allInvoiceItems.push(...resolved);
}

  // --- Invoice-centric fulfillment matching ---
  // PO items are keyed by their itemCode (ERP code)
  const poItemsByCode = {};
  for (const item of poItems) {
    const code = String(item.itemCode || '').trim().toLowerCase();
    if (code) {
      if (!poItemsByCode[code]) {
        poItemsByCode[code] = { totalQty: 0, skuMaster: item.skuMaster || null, skuName: item.skuName || null, itemCode: item.itemCode };
      }
      poItemsByCode[code].totalQty += Number(item.quantity) || 0;
    }
  }

  // GRN items keyed by SKU ID or raw code
  const grnBySku = {};
  for (const item of allGrnItems) {
    const key = item.skuMaster ? String(item.skuMaster) : `raw:${String(item.itemCode || '').trim().toLowerCase()}`;
    if (!grnBySku[key]) {
      grnBySku[key] = { totalQty: 0, mrp: 0 };
    }
    grnBySku[key].totalQty += Number(item.receivedQuantity) || 0;
    if (item.mrp) grnBySku[key].mrp = Number(item.mrp);
  }

  // Build items from ALL invoice items (primary source)
  const items = [];
  const seenSkus = new Set();

  for (const invItem of allInvoiceItems) {
    const invCode = String(invItem.itemCode || '').trim();
    const invCodeLower = invCode.toLowerCase();
    const quantity = Number(invItem.quantity) || 0;
    const rate = Number(invItem.unitRate) || 0;
    const mrp = Number(invItem.mrp) || 0;

    // Look up SKU via eanCode (invoice item code = EAN code)
    const sku = invItem.skuMaster || null;
    const skuId = sku ? String(sku._id) : null;

    // Check if this SKU's skuErpCode exists in PO
    let poMatch = null;
    if (sku && sku.skuErpCode) {
      const erpCode = String(sku.skuErpCode).trim().toLowerCase();
      poMatch = poItemsByCode[erpCode] || null;
    }
    // Also try direct code match (fallback)
    if (!poMatch) {
      poMatch = poItemsByCode[invCodeLower] || null;
    }

    const poQty = poMatch ? poMatch.totalQty : 0;
    const agreedRate = sku?.agreedRate || 0;

    // GRN data
    const grnKey = skuId || `raw:${invCodeLower}`;
    const grnData = grnBySku[grnKey] || null;
    const grnQty = grnData ? grnData.totalQty : 0;

    // Build reasons
    const itemReasons = [];
    if (!poMatch) {
      itemReasons.push('item_missing_in_po');
    } else {
      if (quantity > poQty) itemReasons.push('invoice_qty_exceeds_po_qty');
      if (sku && rate > 0 && agreedRate > 0) {
        const tolerance = sku.priceTolerance || 0.05;
        const upper = agreedRate * (1 + tolerance);
        const lower = agreedRate * (1 - tolerance);
        if (rate > upper || rate < lower) itemReasons.push('price_mismatch');
      }
      if (sku && mrp > 0 && sku.mrp > 0) {
        const mrpTolerance = 0.01;
        if (mrp > sku.mrp * (1 + mrpTolerance) || mrp < sku.mrp * (1 - mrpTolerance)) {
          itemReasons.push('mrp_mismatch');
        }
      }
    }
    if (grnQty > 0 && quantity > grnQty) itemReasons.push('invoice_qty_exceeds_grn_qty');
    if (grnQty > poQty && poQty > 0) itemReasons.push('grn_qty_exceeds_po_qty');

    // Track unique SKU (aggregate quantities if same SKU appears multiple times)
    const dedupeKey = skuId || `raw:${invCodeLower}`;
    if (seenSkus.has(dedupeKey)) {
      // Aggregate into existing item
      const existing = items.find(i => {
        const iKey = i.skuId || `raw:${(i.erpCode || '').toLowerCase()}`;
        return iKey === dedupeKey;
      });
      if (existing) {
        existing.invoiceQty += quantity;
        if (rate) existing.invoiceRate = rate;
        if (mrp) existing.invoiceMrp = mrp;
        existing.reasons = [...new Set([...existing.reasons, ...itemReasons])];
      }
      continue;
    }
    seenSkus.add(dedupeKey);

    items.push({
      skuId,
      skuName: sku?.name || invItem.skuName || null,
      erpCode: sku?.skuErpCode || poMatch?.itemCode || invCode,
      eanCode: sku?.eanCode || invCode,
      poQty,
      grnQty,
      invoiceQty: quantity,
      agreedRate,
      invoiceRate: rate,
      invoiceMrp: mrp,
      mrp: sku?.mrp || 0,
      inPO: !!poMatch,
      reasons: [...new Set(itemReasons)],
    });

    reasons.push(...itemReasons);
  }

  // Add PO-only items (in PO but not in any invoice)
  for (const [erpCode, poData] of Object.entries(poItemsByCode)) {
    const sku = poData.skuMaster || null;
    const skuId = sku ? String(sku._id) : null;
    const dedupeKey = skuId || `raw:${erpCode}`;
    if (seenSkus.has(dedupeKey)) continue;
    seenSkus.add(dedupeKey);

    const grnKey = skuId || `raw:${erpCode}`;
    const grnData = grnBySku[grnKey] || null;

    items.push({
      skuId,
      skuName: poData.skuName || sku?.name || null,
      erpCode: poData.itemCode || erpCode,
      eanCode: sku?.eanCode || '',
      poQty: poData.totalQty,
      grnQty: grnData ? grnData.totalQty : 0,
      invoiceQty: 0,
      agreedRate: sku?.agreedRate || 0,
      invoiceRate: 0,
      invoiceMrp: 0,
      mrp: sku?.mrp || 0,
      inPO: true,
      reasons: [],
    });
  }

  // Deduplicate reasons
  const uniqueReasons = [...new Set(reasons)];

  // Determine status
  let status;
  if (uniqueReasons.includes('insufficient_documents') && uniqueReasons.length === 1) {
    status = 'insufficient_documents';
  } else if (uniqueReasons.some(r => isHardViolation(r))) {
    status = 'mismatch';
  } else if (uniqueReasons.length > 0) {
    status = 'partially_matched';
  } else {
    status = 'matched';
  }

  // Create audit step
  const auditStep = {
    status,
    reasons: uniqueReasons,
    timestamp: new Date(),
  };

  // Save match audit
  if (poNumber) {
    await MatchAudit.findOneAndUpdate(
      { poNumber },
      { $push: { steps: auditStep } },
      { upsert: true }
    );
  }

  return {
    poNumber,
    status,
    reasons: uniqueReasons,
    documents: {
      po: primaryPO ? {
        _id: primaryPO._id,
        poNumber: primaryPO.poNumber,
        poDate: primaryPO.poDate,
        vendorName: primaryPO.vendorName,
        items: primaryPO.items,
        filePath: primaryPO.filePath,
      } : null,
      grns: grns.map(g => ({
        _id: g._id,
        grnNumber: g.grnNumber,
        grnDate: g.grnDate,
        poNumber: g.poNumber,
        items: g.items,
        filePath: g.filePath,
      })),
      invoices: invoices.map(i => ({
        _id: i._id,
        invoiceNumber: i.invoiceNumber,
        invoiceDate: i.invoiceDate,
        poNumber: i.poNumber,
        items: i.items,
        filePath: i.filePath,
      })),
    },
    items,
  };
}

// Summary endpoint data
async function getSummary(poNumber) {
  const match = await getMatch(poNumber);
  const primaryPO = match.documents.po;

  // Calculate PO total amount
  let poAmount = 0;
  if (primaryPO) {
    const po = await PurchaseOrder.findById(primaryPO._id);
    if (po) {
      for (const item of po.items) {
        poAmount += (item.quantity || 0) * (item.unitRate || 0);
      }
    }
  }

  // Calculate invoiced and received totals
  let totalInvoiced = 0;
  let totalReceived = 0;
  for (const item of match.items) {
    totalInvoiced += item.invoiceQty * item.invoiceRate;
    totalReceived += item.grnQty;
  }

  // Cumulative quantities
  const cumulativeInvoicedQty = match.items.reduce((sum, i) => sum + i.invoiceQty, 0);
  const cumulativeReceivedQty = match.items.reduce((sum, i) => sum + i.grnQty, 0);
  const totalPoQty = match.items.reduce((sum, i) => sum + i.poQty, 0);
  const pendingDelivery = Math.max(0, totalPoQty - cumulativeReceivedQty);

  return {
    poNumber,
    poAmount: Math.round(poAmount * 100) / 100,
    totalInvoiced: Math.round(totalInvoiced * 100) / 100,
    totalReceived: cumulativeReceivedQty,
    status: match.status,
    reasons: match.reasons,
    documents: match.documents,
    cumulativeInvoicedQty,
    cumulativeReceivedQty,
    pendingDelivery,
    items: match.items,
  };
}

module.exports = { getMatch, getSummary, resolveSku };
