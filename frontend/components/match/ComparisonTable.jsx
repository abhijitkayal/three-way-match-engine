'use client';

import { formatCurrency, formatQty } from '../../lib/constants';
import { formatReason } from '../../lib/constants';

export default function ComparisonTable({ items = [] }) {
  if (!items.length) {
    return <p className="text-sm text-muted-foreground py-4">No items to compare.</p>;
  }

  function qtyCellClass(poQty, compareQty) {
    if (compareQty == null || poQty == null) return '';
    if (Number(compareQty) > Number(poQty)) return 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 font-semibold';
    if (Number(compareQty) < Number(poQty)) return 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300';
    return 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300';
  }

  function priceCellClass(agreed, invoice) {
    if (agreed == null || invoice == null) return '';
    if (Number(invoice) !== Number(agreed)) return 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 font-semibold';
    return '';
  }
  console.log(items);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs border border-border">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left px-3 py-2.5 border-b border-r border-border font-semibold whitespace-nowrap">SKU</th>
            <th className="text-left px-3 py-2.5 border-b border-r border-border font-semibold whitespace-nowrap">ERP Code</th>
            <th className="text-right px-3 py-2.5 border-b border-r border-border font-semibold whitespace-nowrap">PO Qty</th>
            <th className="text-right px-3 py-2.5 border-b border-r border-border font-semibold whitespace-nowrap">GRN Qty</th>
            <th className="text-right px-3 py-2.5 border-b border-r border-border font-semibold whitespace-nowrap">Invoice Qty</th>
            <th className="text-right px-3 py-2.5 border-b border-r border-border font-semibold whitespace-nowrap">Agreed Price</th>
            <th className="text-right px-3 py-2.5 border-b border-r border-border font-semibold whitespace-nowrap">Invoice Price</th>
            <th className="text-right px-3 py-2.5 border-b border-r border-border font-semibold whitespace-nowrap">Unit MRP</th>
            <th className="text-right px-3 py-2.5 border-b border-r border-border font-semibold whitespace-nowrap">Invoice MRP</th>
            <th className="text-left px-3 py-2.5 border-b border-border font-semibold whitespace-nowrap">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const hasIssue = item.reasons && item.reasons.length > 0;
            return (
              <tr
                key={idx}
                className={`${hasIssue ? 'bg-red-50/50 dark:bg-red-950/50' : ''} hover:bg-muted/50 transition-colors`}
              >
                <td className="px-3 py-2 border-b border-r border-border whitespace-nowrap">
                  {item.skuName ? (
                    <span className="font-medium">{item.skuName}</span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <span>⚠</span> Unmapped SKU 
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 border-b border-r border-border font-mono text-muted-foreground">{item.erpCode || '-'}</td>
                <td className={`px-3 py-2 border-b border-r border-border text-right ${qtyCellClass(item.poQty, item.poQty)}`}>
                  {formatQty(item.poQty)}
                </td>
                <td className={`px-3 py-2 border-b border-r border-border text-right ${qtyCellClass(item.poQty, item.grnQty)}`}>
                  {formatQty(item.grnQty)}
                </td>
                <td className={`px-3 py-2 border-b border-r border-border text-right ${qtyCellClass(item.poQty, item.invoiceQty)}`}>
                  {formatQty(item.invoiceQty)}
                </td>
                <td className="px-3 py-2 border-b border-r border-border text-right">
                  {formatCurrency(item.agreedRate)}
                </td>
                <td className={`px-3 py-2 border-b border-r border-border text-right ${priceCellClass(item.agreedRate, item.invoiceRate)}`}>
                  {formatCurrency(item.invoiceRate)}
                </td>
                <td className="px-3 py-2 border-b border-r border-border text-right">
                  {formatCurrency(item.mrp)}
                </td>
                <td className={`px-3 py-2 border-b border-r border-border text-right ${priceCellClass(item.mrp, item.invoiceMrp)}`}>
                  {formatCurrency(item.invoiceMrp)}
                </td>
                <td className="px-3 py-2 border-b border-border">
                  {hasIssue ? (
                    <div className="flex flex-wrap gap-1">
                      {item.reasons.map((r, i) => (
                        <span
                          key={i}
                          className="inline-block bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-[10px] px-1.5 py-0.5 rounded font-medium"
                        >
                          {formatReason(r)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-medium">✓ MATCH</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
