'use client';

import DocumentPreview from './DocumentPreview';
import MismatchBanner from './MismatchBanner';
import { formatDate, formatCurrency } from '../../lib/constants';

function getItemStatus(item, matchItems = []) {
  const matchItem = matchItems.find(
    (m) => m.erpCode === item.itemCode || m.skuName === item.skuMaster?.name
  );
  if (!matchItem) return { label: 'Not in PO', color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950' };
  if (matchItem.reasons?.length > 0) {
    if (matchItem.reasons.includes('price_mismatch')) return { label: 'Rate Mismatch', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950' };
    if (matchItem.reasons.includes('mrp_mismatch')) return { label: 'MRP Mismatch', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950' };
    if (matchItem.reasons.includes('invoice_qty_exceeds_po_qty')) return { label: 'Qty Mismatch', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950' };
    if (matchItem.reasons.includes('invoice_qty_exceeds_grn_qty')) return { label: 'Qty Mismatch', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950' };
    return { label: 'Mismatch', color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950' };
  }
  return { label: 'Matched', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950' };
}

function getMismatchDetails(item, matchItems = []) {
  const matchItem = matchItems.find(
    (m) => m.erpCode === item.itemCode || m.skuName === item.skuMaster?.name
  );
  if (!matchItem || !matchItem.reasons?.length) return null;
  const details = [];
  for (const reason of matchItem.reasons) {
    switch (reason) {
      case 'price_mismatch':
        details.push({
          field: 'Rate',
          expected: `₹${matchItem.agreedRate?.toFixed(2) || '-'}`,
          actual: `₹${item.unitRate?.toFixed(2) || '-'}`,
        });
        break;
      case 'mrp_mismatch':
        details.push({
          field: 'MRP',
          expected: `₹${matchItem.mrp?.toFixed(2) || '-'}`,
          actual: `₹${item.mrp?.toFixed(2) || '-'}`,
        });
        break;
      case 'invoice_qty_exceeds_po_qty':
        details.push({
          field: 'Quantity',
          expected: `PO: ${matchItem.poQty}`,
          actual: `Invoice: ${matchItem.invoiceQty}`,
        });
        break;
      case 'invoice_qty_exceeds_grn_qty':
        details.push({
          field: 'Quantity',
          expected: `GRN: ${matchItem.grnQty}`,
          actual: `Invoice: ${matchItem.invoiceQty}`,
        });
        break;
      case 'unmapped_master_sku':
        details.push({ field: 'SKU', expected: 'Mapped SKU', actual: 'Unmapped' });
        break;
    }
  }
  return details;
}

export default function InvoiceView({ invoice, matchReasons = [], matchItems = [] }) {
  if (!invoice) {
    return (
      <div className="bg-card rounded-lg border p-6 text-center text-muted-foreground">
        No invoice selected.
      </div>
    );
  }

  const items = invoice.items || [];

  return (
    <div className="space-y-4">
      {matchReasons.length > 0 && <MismatchBanner reasons={matchReasons} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border overflow-hidden">
          <div className="border-l-4 border-amber-500 p-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Invoice</h4>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Invoice Number</label>
                <p className="text-sm font-semibold">{invoice.invoiceNumber || '-'}</p>
              </div>
              <div>
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">PO Number</label>
                <p className="text-sm">{invoice.poNumber || '-'}</p>
              </div>
              <div>
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Invoice Date</label>
                <p className="text-sm">{formatDate(invoice.invoiceDate)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Original Invoice</h4>
          <DocumentPreview documentId={invoice._id} filePath={invoice.filePath} />
        </div>
      </div>

      {/* {items.length > 0 && (
        <div className="bg-card rounded-lg border">
          <div className="px-4 py-3 border-b border-border">
            <h4 className="text-sm font-semibold">Invoice Items ({items.length})</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground border-b">#</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground border-b">Item Code</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground border-b">Description</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground border-b">SKU</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground border-b">Qty</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground border-b">Unit Rate</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground border-b">MRP</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground border-b">Amount</th>
                  <th className="text-center px-4 py-2.5 font-medium text-muted-foreground border-b">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const status = getItemStatus(item, matchItems);
                  const mismatchDetails = getMismatchDetails(item, matchItems);
                  const amount = (item.quantity || 0) * (item.unitRate || 0);
                  const hasIssue = status.label !== 'Matched';
                  return (
                    <tr key={item._id || idx} className={`${hasIssue ? 'bg-amber-50/50 dark:bg-amber-950/50' : ''} hover:bg-muted/50`}>
                      <td className="px-4 py-2.5 border-b text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-2.5 border-b font-mono text-xs">{item.itemCode || '-'}</td>
                      <td className="px-4 py-2.5 border-b">{item.description || '-'}</td>
                      <td className="px-4 py-2.5 border-b">
                        {item.skuMaster?.name ? (
                          <span className="font-medium">{item.skuMaster.name}</span>
                        ) : (
                          <span className="text-muted-foreground italic">Unmapped SKU</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 border-b text-right">{item.quantity ?? '-'}</td>
                      <td className="px-4 py-2.5 border-b text-right">
                        {item.unitRate != null ? formatCurrency(item.unitRate) : '-'}
                      </td>
                      <td className="px-4 py-2.5 border-b text-right">
                        {item.mrp != null ? formatCurrency(item.mrp) : '-'}
                      </td>
                      <td className="px-4 py-2.5 border-b text-right font-medium">
                        {amount > 0 ? formatCurrency(amount) : '-'}
                      </td>
                      <td className="px-4 py-2.5 border-b text-center">
                        <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                        {mismatchDetails && mismatchDetails.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {mismatchDetails.map((d, i) => (
                              <div key={i} className="text-[9px] text-amber-600 dark:text-amber-400">
                                {d.field}: {d.expected} → {d.actual}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )} */}
    </div>
  );
}
