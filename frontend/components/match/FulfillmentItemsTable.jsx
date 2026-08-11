'use client';

import { formatQty, formatCurrency } from '../../lib/constants';

export default function FulfillmentItemsTable({ poDocument, invoice, grn }) {
  if (!poDocument && !invoice) {
    return (
      <div className="bg-card rounded-lg border p-6 text-center text-muted-foreground">
        No data available.
      </div>
    );
  }

  const poItems = poDocument?.items || [];
  const invoiceItems = invoice?.items || [];
  const grnItems = grn?.items || [];

  // Build PO lookup by itemCode (ERP code)
  const poByCode = {};
  for (const item of poItems) {
    const code = String(item.itemCode || '').trim().toLowerCase();
    if (code) {
      if (!poByCode[code]) {
        poByCode[code] = { totalQty: 0, item: item };
      }
      poByCode[code].totalQty += item.quantity || 0;
    }
  }

  // Build GRN lookup by itemCode
  const grnByCode = {};
  for (const item of grnItems) {
    const code = String(item.itemCode || '').trim().toLowerCase();
    if (code) {
      if (!grnByCode[code]) {
        grnByCode[code] = { totalQty: 0 };
      }
      grnByCode[code].totalQty += item.receivedQuantity || 0;
    }
  }

  const allItems = [];

  // Start from ALL invoice items (primary source)
  for (const invItem of invoiceItems) {
    const invCode = String(invItem.itemCode || '').trim();
    const invCodeLower = invCode.toLowerCase();
    const quantity = invItem.quantity || 0;
    const rate = invItem.unitRate || 0;
    const mrp = invItem.mrp || 0;

    // Look up SKU via eanCode (invoice item code = EAN code in SKU master)
    const sku = invItem.skuMaster || null;

    // Check if this SKU's skuErpCode exists in PO items
    let poMatch = null;
    if (sku && sku.skuErpCode) {
      const erpCode = String(sku.skuErpCode).trim().toLowerCase();
      poMatch = poByCode[erpCode] || null;
    }
    // Fallback: direct code match
    if (!poMatch) {
      poMatch = poByCode[invCodeLower] || null;
    }

    const poQty = poMatch ? poMatch.totalQty : 0;

    // GRN lookup via SKU erpCode or direct code
    let grnQty = 0;
    if (sku && sku.skuErpCode) {
      const erpCode = String(sku.skuErpCode).trim().toLowerCase();
      grnQty = grnByCode[erpCode]?.totalQty || 0;
    }
    if (!grnQty) {
      grnQty = grnByCode[invCodeLower]?.totalQty || 0;
    }

    allItems.push({
      itemCode: invCode,
      skuName: sku?.name || invItem.skuName || '-',
      erpCode: sku?.skuErpCode || poMatch?.item?.itemCode || '-',
      eanCode: sku?.eanCode || invCode,
      poQty,
      invoiceQty: quantity,
      grnQty,
      rate,
      mrp,
      agreedRate: sku?.agreedRate || 0,
      inPO: !!poMatch,
      source: 'invoice',
    });
  }

  // Add PO-only items (in PO but not in invoice)
  for (const [erpCode, poData] of Object.entries(poByCode)) {
    const existsInInvoice = allItems.some(item => {
      const sku = item.skuName !== '-' ? item : null;
      return item.erpCode?.toLowerCase() === erpCode;
    });
    if (existsInInvoice) continue;

    const item = poData.item;
    const sku = item.skuMaster || null;

    let grnQty = 0;
    if (sku && sku.skuErpCode) {
      grnQty = grnByCode[String(sku.skuErpCode).trim().toLowerCase()]?.totalQty || 0;
    }
    if (!grnQty) {
      grnQty = grnByCode[erpCode]?.totalQty || 0;
    }

    allItems.push({
      itemCode: item.itemCode || erpCode,
      skuName: sku?.name || item.description || '-',
      erpCode: item.itemCode || erpCode,
      eanCode: sku?.eanCode || '-',
      poQty: poData.totalQty,
      invoiceQty: 0,
      grnQty,
      rate: 0,
      mrp: 0,
      agreedRate: sku?.agreedRate || 0,
      inPO: true,
      source: 'po',
    });
  }

  function getStatus(item) {
    if (!item.inPO) {
      return { label: 'Not Present in PO', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' };
    }
    if (item.invoiceQty > 0 && item.poQty > 0) {
      return { label: 'Match', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' };
    }
    if (item.poQty > 0 && item.invoiceQty === 0) {
      return { label: 'PO Only', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' };
    }
    return { label: 'Match', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' };
  }

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h4 className="text-sm font-semibold">Fulfillment Items</h4>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left px-3 py-2.5 border-b border-r border-border font-semibold w-10">#</th>
              <th className="text-left px-3 py-2.5 border-b border-r border-border font-semibold">Invoice Item Code (EAN)</th>
              <th className="text-left px-3 py-2.5 border-b border-r border-border font-semibold">Item Name</th>
              <th className="text-left px-3 py-2.5 border-b border-r border-border font-semibold">ERP Code</th>
              <th className="text-right px-3 py-2.5 border-b border-r border-border font-semibold">PO Qty</th>
              <th className="text-right px-3 py-2.5 border-b border-r border-border font-semibold">Invoice Qty</th>
              <th className="text-right px-3 py-2.5 border-b border-r border-border font-semibold">GRN Qty</th>
              <th className="text-right px-3 py-2.5 border-b border-r border-border font-semibold">Rate</th>
              <th className="text-center px-3 py-2.5 border-b border-border font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {allItems.map((item, idx) => {
              const status = getStatus(item);
              return (
                <tr key={idx} className={`hover:bg-muted/50 transition-colors ${!item.inPO ? 'bg-red-50/50 dark:bg-red-950/50' : ''}`}>
                  <td className="px-3 py-2 border-b border-r border-border text-muted-foreground">{idx + 1}</td>
                  <td className="px-3 py-2 border-b border-r border-border font-mono">{item.itemCode}</td>
                  <td className="px-3 py-2 border-b border-r border-border font-medium">{item.skuName}</td>
                  <td className="px-3 py-2 border-b border-r border-border font-mono text-muted-foreground">{item.erpCode}</td>
                  <td className="px-3 py-2 border-b border-r border-border text-right tabular-nums">{item.poQty > 0 ? formatQty(item.poQty) : '-'}</td>
                  <td className="px-3 py-2 border-b border-r border-border text-right tabular-nums">{item.invoiceQty > 0 ? formatQty(item.invoiceQty) : '-'}</td>
                  <td className="px-3 py-2 border-b border-r border-border text-right tabular-nums">{item.grnQty > 0 ? formatQty(item.grnQty) : '-'}</td>
                  <td className="px-3 py-2 border-b border-r border-border text-right tabular-nums">{item.rate > 0 ? formatCurrency(item.rate) : '-'}</td>
                  <td className="px-3 py-2 border-b border-border text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
