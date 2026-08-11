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

// Resolve all items in a document and attach SKU references
// async function resolveDocumentItems(items, codeField = 'itemCode') {
//   const resolved = [];
//   for (const item of items) {
//     const { skuMaster, warning } = await resolveSku(item[codeField]);
//     resolved.push({
//       ...item,
//       skuMaster: skuMaster ? skuMaster._id : null,
//       skuName: skuMaster ? skuMaster.name : null,
//       warning,
//     });
//   }
//   return resolved;
// }

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
// Aggregate quantities by SKU (or by raw itemCode if unresolved)
// function aggregateBySku(items, qtyField) {
//   const map = {};

//   for (const item of items) {
//     // Use skuMaster._id as key, or normalized raw itemCode as fallback
//     const key = item.skuMaster
//       ? String(item.skuMaster)
//       : `raw:${(item.itemCode || '').trim().toLowerCase()}`;

//     if (!map[key]) {
//       map[key] = {
//         skuMaster: item.skuMaster,
//         skuName: item.skuName || null,
//         itemCode: item.itemCode || '',
//         description: item.description || '',
//         totalQty: 0,
//         warnings: [],
//         rate: item.unitRate || 0,
//         mrp: item.mrp || 0,
//       };
//     }

//     map[key].totalQty += Number(item[qtyField]) || 0;

//     // Track rate and mrp from invoice items
//     if (item.unitRate) map[key].rate = item.unitRate;
//     if (item.mrp) map[key].mrp = item.mrp;

//     if (item.warning) {
//       map[key].warnings.push(item.warning);
//     }
//   }

//   return map;
// }

function aggregateBySku(items, qtyField) {
  const map = {};

  for (const rawItem of items) {
    // Convert Mongoose subdocument to plain object
    const item = rawItem?.toObject
      ? rawItem.toObject()
      : rawItem;

    const rawCode = item.itemCode != null
      ? String(item.itemCode).trim()
      : '';

    const key = item.skuMaster
      ? String(item.skuMaster)
      : `raw:${rawCode.toLowerCase()}`;

    // IMPORTANT: read the actual quantity field
    const quantity = Number(item[qtyField]) || 0;

    console.log(
      `AGGREGATE -> code: ${rawCode}, field: ${qtyField}, value:`,
      item[qtyField],
      `=> quantity: ${quantity}`
    );

    if (!map[key]) {
      map[key] = {
        skuMaster: item.skuMaster || null,
        skuName: item.skuName || null,
        itemCode: rawCode,
        description: item.description || '',
        totalQty: 0,
        warnings: [],
        rate: Number(item.unitRate) || 0,
        mrp: Number(item.mrp) || 0,
      };
    }

    map[key].totalQty += quantity;

    if (item.unitRate) {
      map[key].rate = Number(item.unitRate);
    }

    if (item.mrp) {
      map[key].mrp = Number(item.mrp);
    }

    if (item.warning) {
      map[key].warnings.push(item.warning);
    }
  }

  console.log(
    `AGGREGATED ${qtyField}:`,
    JSON.stringify(map, null, 2)
  );

  return map;
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

  // Resolve all items
//   const poItems = primaryPO
//   ? await resolveDocumentItems(primaryPO.items)
//   : [];

// console.log(
//   "========== ORIGINAL PO ITEMS =========="
// );

// console.log(
//   JSON.stringify(
//     poItems.map(item => ({
//       itemCode: item.itemCode,
//       description: item.description,
//       quantity: item.quantity,
//       skuMaster: item.skuMaster,
//       skuName: item.skuName,
//     })),
//     null,
//     2
//   )
// );

// console.log(
//   "========================================"
// );
//   const allGrnItems = [];
//   for (const grn of grns) {
//     const resolved = await resolveDocumentItems(grn.items);
//     allGrnItems.push(...resolved);
//   }
//   const allInvoiceItems = [];
//   for (const inv of invoices) {
//     const resolved = await resolveDocumentItems(inv.items);
//     allInvoiceItems.push(...resolved);
//   }

// Resolve and permanently save PO SKU mappings
const poItems = primaryPO
  ? await resolveAndSaveDocumentItems(primaryPO)
  : [];

// Resolve and permanently save GRN SKU mappings
const allGrnItems = [];

for (const grn of grns) {
  const resolved = await resolveAndSaveDocumentItems(grn);
  allGrnItems.push(...resolved);
}

// Resolve and permanently save Invoice SKU mappings
const allInvoiceItems = [];

for (const inv of invoices) {
  const resolved = await resolveAndSaveDocumentItems(inv);
  allInvoiceItems.push(...resolved);
}
  // Aggregate by SKU
  const poAgg = aggregateBySku(poItems, 'quantity');
  const grnAgg = aggregateBySku(allGrnItems, 'receivedQuantity');
  const invoiceAgg = aggregateBySku(allInvoiceItems, 'quantity');

console.log("PO AGG KEYS:", Object.keys(poAgg));
console.log("PO AGG:", JSON.stringify(poAgg, null, 2));
console.log("GRN AGG KEYS:", Object.keys(grnAgg));
console.log("INVOICE AGG KEYS:", Object.keys(invoiceAgg));

  // Build combined key set from all sources
  const allKeys = new Set([...Object.keys(poAgg), ...Object.keys(grnAgg), ...Object.keys(invoiceAgg)]);

  // Load SKU masters for price comparison
  const skuIds = [...allKeys]
    .filter(k => !k.startsWith('raw:'))
    .map(k => {
      const item = poAgg[k] || grnAgg[k] || invoiceAgg[k];
      return item?.skuMaster;
    })
    .filter(Boolean);

  const skuMap = {};
  if (skuIds.length > 0) {
    const skus = await SkuMaster.find({ _id: { $in: skuIds } });
    skus.forEach(s => { skuMap[String(s._id)] = s; });
  }

  // Per-item matching
  const items = [];

  for (const key of allKeys) {
    const po = poAgg[key] || null;
    const grn = grnAgg[key] || null;
    const invoice = invoiceAgg[key] || null;

    const skuId = key.startsWith('raw:') ? null : key;
    const sku = skuId ? skuMap[skuId] : null;
    

    const poQty = po ? (po.totalQty || 0) : 0;
    const grnQty = grn ? (grn.totalQty || 0) : 0;
    const invoiceQty = invoice ? (invoice.totalQty || 0) : 0;
    

    const itemReasons = [];

    // Item missing in PO
    if ((grn || invoice) && !po) {
      itemReasons.push('item_missing_in_po');
    }

    // Collect warnings from resolved items
    if (po?.warnings) itemReasons.push(...po.warnings.filter(w => w === 'unmapped_master_sku'));
    if (grn?.warnings) itemReasons.push(...grn.warnings.filter(w => w === 'unmapped_master_sku'));
    if (invoice?.warnings) itemReasons.push(...invoice.warnings.filter(w => w === 'unmapped_master_sku'));

    // Quantity checks (only if PO exists)
    if (po) {
      if (grnQty > poQty) itemReasons.push('grn_qty_exceeds_po_qty');
      if (invoiceQty > poQty) itemReasons.push('invoice_qty_exceeds_po_qty');
    }

    // GRN exists but invoice exceeds GRN
    if (grn && invoiceQty > grnQty) {
      itemReasons.push('invoice_qty_exceeds_grn_qty');
    }

    // Price mismatch - compare invoice rate vs SKU agreed rate
    if (sku && invoice?.rate && sku.agreedRate > 0) {
      const tolerance = sku.priceTolerance || 0.05;
      const upper = sku.agreedRate * (1 + tolerance);
      const lower = sku.agreedRate * (1 - tolerance);
      if (invoice.rate > upper || invoice.rate < lower) {
        itemReasons.push('price_mismatch');
      }
    }

    // MRP mismatch - compare invoice MRP vs SKU MRP
    if (sku) {
      if (invoice?.mrp && sku.mrp > 0) {
        const mrpTolerance = 0.01; // ~1%
        const upperMrp = sku.mrp * (1 + mrpTolerance);
        const lowerMrp = sku.mrp * (1 - mrpTolerance);
        if (invoice.mrp > upperMrp || invoice.mrp < lowerMrp) {
          itemReasons.push('mrp_mismatch');
        }
      }
      if (grn?.mrp && sku.mrp > 0) {
        const mrpTolerance = 0.01;
        const upperMrp = sku.mrp * (1 + mrpTolerance);
        const lowerMrp = sku.mrp * (1 - mrpTolerance);
        if (grn.mrp > upperMrp || grn.mrp < lowerMrp) {
          itemReasons.push('mrp_mismatch');
        }
      }
    }

    reasons.push(...itemReasons);

    items.push({
      skuId,
      skuName: sku?.name || po?.skuName || grn?.skuName || invoice?.skuName || null,
      erpCode: po?.itemCode || grn?.itemCode || invoice?.itemCode || '',
      poQty,
      grnQty,
      invoiceQty,
      agreedRate: sku?.agreedRate || 0,
      invoiceRate: invoice?.rate || 0,
      mrp: sku?.mrp || 0,
      reasons: [...new Set(itemReasons)],
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
