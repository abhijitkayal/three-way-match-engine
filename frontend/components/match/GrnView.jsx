'use client';

import DocumentPreview from './DocumentPreview';
import MismatchBanner from './MismatchBanner';
import { formatDate, formatCurrency, formatQty } from '../../lib/constants';

function findMatchingPoItem(grnItem, poItems) {
  const grnSkuId = grnItem.skuMaster?._id || grnItem.skuMaster;
  const grnItemCode = (grnItem.itemCode || '').trim();

  if (grnSkuId) {
    const found = poItems.find((p) => {
      const pSkuId = p.skuMaster?._id || p.skuMaster;
      return pSkuId && String(pSkuId) === String(grnSkuId);
    });
    if (found) return found;
  }

  if (grnItemCode) {
    return poItems.find((p) => (p.itemCode || '').trim() === grnItemCode) || null;
  }

  return null;
}

function findMatchingMatchItem(grnItem, matchItems) {
  const grnSkuId = grnItem.skuMaster?._id || grnItem.skuMaster;
  const grnItemCode = (grnItem.itemCode || '').trim();

  if (grnSkuId) {
    const found = matchItems.find((m) => m.skuId && String(m.skuId) === String(grnSkuId));
    if (found) return found;
  }

  if (grnItemCode) {
    return matchItems.find((m) => m.erpCode === grnItemCode) || null;
  }

  return null;
}

function buildGrnItemRows(grnItems, poItems, matchItems) {
  return grnItems.map((grnItem) => {
    const sku = grnItem.skuMaster || null;
    const poItem = findMatchingPoItem(grnItem, poItems);
    const matchItem = findMatchingMatchItem(grnItem, matchItems);

    const receivedQty = Number(grnItem.receivedQuantity) || 0;
    const poQty = poItem ? Number(poItem.quantity) || 0 : null;
    const pending = poQty !== null ? Math.max(0, poQty - receivedQty) : null;
    const unitPrice = grnItem.unitRate || sku?.agreedRate || null;
    const mrp = grnItem.mrp || sku?.mrp || null;
    const grossAmount = unitPrice != null ? receivedQty * unitPrice : null;
    const grnOnlyReasons = ['grn_qty_exceeds_po_qty', 'mrp_mismatch', 'price_mismatch'];
    const allReasons = matchItem?.reasons || [];
    const reasons = allReasons.filter((r) => grnOnlyReasons.includes(r));

    let status = 'Matched';
    let statusColor =
      'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950';

    if (!sku) {
      status = 'Unmapped SKU';
      statusColor =
        'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950';
    } else if (reasons.includes('grn_qty_exceeds_po_qty')) {
      status = 'Qty Mismatch';
      statusColor =
        'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950';
    } else if (reasons.includes('mrp_mismatch')) {
      status = 'MRP Mismatch';
      statusColor =
        'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950';
    } else if (reasons.includes('price_mismatch')) {
      status = 'Price Mismatch';
      statusColor =
        'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950';
    } else if (poQty !== null && receivedQty < poQty) {
      status = 'Partial';
      statusColor =
        'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950';
    } else if (poQty !== null && receivedQty > poQty) {
      status = 'Over Delivered';
      statusColor =
        'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950';
    }

    return {
      sku,
      grnItemCode: grnItem.itemCode || '',
      description: grnItem.description || '',
      receivedQty,
      poQty,
      pending,
      unitPrice,
      mrp,
      grossAmount,
      reasons,
      status,
      statusColor,
      highlightReceivedQty: reasons.includes('grn_qty_exceeds_po_qty'),
      highlightMrp: reasons.includes('mrp_mismatch'),
      highlightPrice: reasons.includes('price_mismatch'),
      hasIssue: !sku || reasons.length > 0,
      isUnmapped: !sku,
    };
  });
}

function collectGrnReasons(itemRows, matchReasons) {
  const reasons = new Set();
  for (const row of itemRows) {
    for (const r of row.reasons) {
      reasons.add(r);
    }
  }
  const grnRelevantTopLevel = ['grn_qty_exceeds_po_qty', 'duplicate_document'];
  for (const r of matchReasons) {
    if (grnRelevantTopLevel.includes(r)) {
      reasons.add(r);
    }
  }
  return [...reasons];
}

export default function GrnView({
  grn,
  poDocument,
  matchItems = [],
  matchReasons = [],
  allGrns = [],
}) {
  if (!grn) {
    return (
      <div className="bg-card rounded-lg border p-8 text-center text-muted-foreground">
        <p className="text-sm">No GRN available</p>
      </div>
    );
  }

  const poItems = poDocument?.items || [];
  const grnItems = grn.items || [];
  const itemRows = buildGrnItemRows(grnItems, poItems, matchItems);
  const grnReasons = collectGrnReasons(itemRows, matchReasons);

  const totalOrderedQty = poItems.reduce(
    (s, i) => s + (Number(i.quantity) || 0),
    0
  );
  const totalReceivedQty = allGrns.reduce((s, g) => {
    return (
      s +
      (g.items || []).reduce(
        (s2, i) => s2 + (Number(i.receivedQuantity) || 0),
        0
      )
    );
  }, 0);
  const pendingQty = Math.max(0, totalOrderedQty - totalReceivedQty);
  const deliveryPct =
    totalOrderedQty > 0
      ? Math.min(Math.round((totalReceivedQty / totalOrderedQty) * 100), 100)
      : 0;

  let deliveryStatus = 'Not Delivered';
  let deliveryStatusColor =
    'text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700';
  if (totalReceivedQty > 0 && totalReceivedQty < totalOrderedQty) {
    deliveryStatus = 'Partially Delivered';
    deliveryStatusColor =
      'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800';
  } else if (totalReceivedQty >= totalOrderedQty && totalOrderedQty > 0) {
    if (totalReceivedQty > totalOrderedQty) {
      deliveryStatus = 'Over Delivered';
      deliveryStatusColor =
        'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800';
    } else {
      deliveryStatus = 'Fully Delivered';
      deliveryStatusColor =
        'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800';
    }
  }

  return (
    <div className="space-y-6">
      {grnReasons.length > 0 && <MismatchBanner reasons={grnReasons} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border overflow-hidden">
          <div className="border-l-4 border-emerald-500 p-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Delivery / GRN
            </h4>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  GRN Number
                </label>
                <p className="text-sm font-semibold">{grn.grnNumber || '-'}</p>
              </div>
              <div>
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  PO Number
                </label>
                <p className="text-sm">{grn.poNumber || '-'}</p>
              </div>
              <div>
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  GRN Date
                </label>
                <p className="text-sm">{formatDate(grn.grnDate)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Original GRN
          </h4>
          <DocumentPreview documentId={grn._id} filePath={grn.filePath} />
        </div>
      </div>

      <div className="bg-card rounded-lg border p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Delivery Progress
          </h4>
          <span className={`text-xs font-medium px-3 py-1 rounded-full border ${deliveryStatusColor}`}>
            {deliveryStatus}: {deliveryPct}%
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                totalReceivedQty > totalOrderedQty
                  ? 'bg-orange-500'
                  : deliveryPct === 100
                  ? 'bg-emerald-500'
                  : 'bg-primary-500'
              }`}
              style={{ width: `${Math.min(deliveryPct, 100)}%` }}
            />
          </div>
          <span className="text-sm font-semibold w-16 text-right">
            {deliveryPct}%
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          {formatQty(totalReceivedQty)} / {formatQty(totalOrderedQty)} units
          {pendingQty > 0 && ` · ${formatQty(pendingQty)} pending`}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card rounded-lg border p-4">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Ordered
          </p>
          <p className="text-xl font-bold mt-1">{formatQty(totalOrderedQty)}</p>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Received
          </p>
          <p className="text-xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
            {formatQty(totalReceivedQty)}
          </p>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Pending
          </p>
          <p className="text-xl font-bold mt-1 text-amber-600 dark:text-amber-400">
            {formatQty(pendingQty)}
          </p>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Fulfillment
          </p>
          <p className="text-xl font-bold mt-1">{deliveryPct}%</p>
        </div>
      </div>

      {itemRows.length > 0 ? (
        <div className="bg-card rounded-lg border">
          <div className="px-4 py-3 border-b border-border">
            <h4 className="text-sm font-semibold">
              GRN Items ({itemRows.length})
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-3 py-2.5 border-b border-r border-border font-semibold">#</th>
                  <th className="text-left px-3 py-2.5 border-b border-r border-border font-semibold">Item / SKU</th>
                  <th className="text-left px-3 py-2.5 border-b border-r border-border font-semibold">SKU ID</th>
                  <th className="text-left px-3 py-2.5 border-b border-r border-border font-semibold">ERP Code</th>
                  <th className="text-left px-3 py-2.5 border-b border-r border-border font-semibold">EAN</th>
                  <th className="text-left px-3 py-2.5 border-b border-r border-border font-semibold">HSN</th>
                  <th className="text-left px-3 py-2.5 border-b border-r border-border font-semibold">UOM</th>
                  <th className="text-right px-3 py-2.5 border-b border-r border-border font-semibold">PO Qty</th>
                  <th className="text-right px-3 py-2.5 border-b border-r border-border font-semibold">Received Qty</th>
                  <th className="text-right px-3 py-2.5 border-b border-r border-border font-semibold">Pending Qty</th>
                  <th className="text-right px-3 py-2.5 border-b border-r border-border font-semibold">Unit Price</th>
                  <th className="text-right px-3 py-2.5 border-b border-r border-border font-semibold">Unit MRP</th>
                  <th className="text-right px-3 py-2.5 border-b border-r border-border font-semibold">Gross Amount</th>
                  <th className="text-left px-3 py-2.5 border-b border-border font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {itemRows.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`${row.hasIssue ? 'bg-amber-50/50 dark:bg-amber-950/50' : ''} hover:bg-muted/50`}
                  >
                    <td className="px-3 py-2 border-b border-r border-border text-muted-foreground">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2 border-b border-r border-border">
                      {row.isUnmapped ? (
                        <div>
                          <span className="text-muted-foreground italic">Unmapped SKU</span>
                          {row.grnItemCode && (
                            <span className="text-[10px] text-muted-foreground ml-1 font-mono">
                              ({row.grnItemCode})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="font-medium">
                          {row.sku?.name || row.description || '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 border-b border-r border-border font-mono text-muted-foreground">
                      {row.sku?._id || '-'}
                    </td>
                    <td className="px-3 py-2 border-b border-r border-border font-mono text-muted-foreground">
                      {row.sku?.skuErpCode || row.grnItemCode || '-'}
                    </td>
                    <td className="px-3 py-2 border-b border-r border-border text-muted-foreground">
                      {row.sku?.eanCode || '-'}
                    </td>
                    <td className="px-3 py-2 border-b border-r border-border text-muted-foreground">
                      {row.sku?.hsnCode || '-'}
                    </td>
                    <td className="px-3 py-2 border-b border-r border-border text-muted-foreground">
                      {row.sku?.uom || '-'}
                    </td>
                    <td className="px-3 py-2 border-b border-r border-border text-right">
                      {row.poQty !== null ? formatQty(row.poQty) : '-'}
                    </td>
                    <td
                      className={`px-3 py-2 border-b border-r border-border text-right font-medium ${
                        row.highlightReceivedQty
                          ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300'
                          : ''
                      }`}
                    >
                      {formatQty(row.receivedQty)}
                    </td>
                    <td className="px-3 py-2 border-b border-r border-border text-right">
                      {row.pending !== null ? (
                        <span
                          className={
                            row.pending > 0
                              ? 'text-amber-600 dark:text-amber-400 font-medium'
                              : ''
                          }
                        >
                          {formatQty(row.pending)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td
                      className={`px-3 py-2 border-b border-r border-border text-right ${
                        row.highlightPrice
                          ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 font-semibold'
                          : ''
                      }`}
                    >
                      {row.unitPrice != null ? formatCurrency(row.unitPrice) : '-'}
                    </td>
                    <td
                      className={`px-3 py-2 border-b border-r border-border text-right ${
                        row.highlightMrp
                          ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 font-semibold'
                          : ''
                      }`}
                    >
                      {row.mrp != null ? formatCurrency(row.mrp) : '-'}
                    </td>
                    <td className="px-3 py-2 border-b border-r border-border text-right font-medium">
                      {row.grossAmount != null
                        ? formatCurrency(row.grossAmount)
                        : '-'}
                    </td>
                    <td className="px-3 py-2 border-b border-border">
                      <span
                        className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${row.statusColor}`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-lg border p-8 text-center text-muted-foreground">
          <p className="text-sm">No GRN items available</p>
        </div>
      )}
    </div>
  );
}
