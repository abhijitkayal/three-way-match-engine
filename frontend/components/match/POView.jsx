'use client';

import DocumentPreview from './DocumentPreview';
import { formatDate, formatCurrency, formatQty } from '../../lib/constants';

export default function POView({ poDocument }) {
  if (!poDocument) {
    return (
      <div className="bg-card rounded-lg border p-6 text-center text-muted-foreground">
        No PO document found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Purchase Order Details</h4>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">PO Number</label>
                <p className="text-sm font-semibold mt-0.5">{poDocument.poNumber || '-'}</p>
              </div>
              <div>
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">PO Date</label>
                <p className="text-sm mt-0.5">{formatDate(poDocument.poDate)}</p>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Vendor</label>
              <p className="text-sm font-medium mt-0.5">{poDocument.vendorName || '-'}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Original Document</h4>
          </div>
          <div className="p-4">
            <DocumentPreview documentId={poDocument._id} filePath={poDocument.filePath} />
          </div>
        </div>
      </div>

      {poDocument.items && poDocument.items.length > 0 && (
        <div className="bg-card rounded-lg border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h4 className="text-sm font-semibold">Purchase Order Items</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-3 py-2.5 border-b border-r border-border font-semibold w-10">#</th>
                  <th className="text-left px-3 py-2.5 border-b border-r border-border font-semibold">Item Code</th>
                  <th className="text-left px-3 py-2.5 border-b border-r border-border font-semibold">Description</th>
                  <th className="text-right px-3 py-2.5 border-b border-r border-border font-semibold">Qty</th>
                  <th className="text-right px-3 py-2.5 border-b border-r border-border font-semibold">Unit Rate</th>
                  <th className="text-right px-3 py-2.5 border-b border-r border-border font-semibold">MRP</th>
                  <th className="text-right px-3 py-2.5 border-b border-r border-border font-semibold">Amount</th>
                  <th className="text-center px-3 py-2.5 border-b border-border font-semibold">SKU</th>
                </tr>
              </thead>
              <tbody>
                {poDocument.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-muted/50 transition-colors">
                    <td className="px-3 py-2 border-b border-r border-border text-muted-foreground">{idx + 1}</td>
                    <td className="px-3 py-2 border-b border-r border-border font-mono text-muted-foreground">{item.itemCode || '-'}</td>
                    <td className="px-3 py-2 border-b border-r border-border font-medium">{item.description || '-'}</td>
                    <td className="px-3 py-2 border-b border-r border-border text-right tabular-nums">{formatQty(item.quantity)}</td>
                    <td className="px-3 py-2 border-b border-r border-border text-right tabular-nums">{item.unitRate ? formatCurrency(item.unitRate) : '-'}</td>
                    <td className="px-3 py-2 border-b border-r border-border text-right tabular-nums">{item.mrp ? formatCurrency(item.mrp) : '-'}</td>
                    <td className="px-3 py-2 border-b border-r border-border text-right font-medium tabular-nums">
                      {item.unitRate ? formatCurrency((item.quantity || 0) * item.unitRate) : '-'}
                    </td>
                    <td className="px-3 py-2 border-b border-border text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          item.skuMaster
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {item.skuMaster ? 'Mapped' : 'Unmapped'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/30 font-semibold">
                  <td colSpan={3} className="px-3 py-2 border-t border-r border-border text-right">Total</td>
                  <td className="px-3 py-2 border-t border-r border-border text-right tabular-nums">
                    {formatQty(poDocument.items.reduce((sum, item) => sum + (item.quantity || 0), 0))}
                  </td>
                  <td className="px-3 py-2 border-t border-r border-border"></td>
                  <td className="px-3 py-2 border-t border-r border-border"></td>
                  <td className="px-3 py-2 border-t border-r border-border text-right tabular-nums">
                    {formatCurrency(poDocument.items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unitRate || 0)), 0))}
                  </td>
                  <td className="px-3 py-2 border-t border-border"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
