'use client';

export default function ItemTable({ items = [], showInvoice = true, showGrn = true }) {
  if (!items.length) {
    return <p className="text-sm text-muted-foreground">No items to display.</p>;
  }

  function hasIssue(item) {
    return item.reasons && item.reasons.length > 0;
  }

  function formatReason(reason) {
    return reason.replace(/_/g, ' ');
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border border-border">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left px-3 py-2 border border-border">SKU Name</th>
            <th className="text-left px-3 py-2 border border-border">ERP Code</th>
            <th className="text-right px-3 py-2 border border-border">PO Qty</th>
            {showGrn && <th className="text-right px-3 py-2 border border-border">GRN Qty</th>}
            {showInvoice && <th className="text-right px-3 py-2 border border-border">Invoice Qty</th>}
            {showInvoice && <th className="text-right px-3 py-2 border border-border">Unit Price</th>}
            {showInvoice && <th className="text-right px-3 py-2 border border-border">MRP</th>}
            <th className="text-left px-3 py-2 border border-border">Issues</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr
              key={idx}
              className={hasIssue(item) ? 'bg-red-50 dark:bg-red-950' : ''}
            >
              <td className="px-3 py-2 border border-border">
                {item.skuName || (
                  <span className="text-orange-600 dark:text-orange-400">Unmapped SKU</span>
                )}
              </td>
              <td className="px-3 py-2 border border-border font-mono text-xs">{item.erpCode || '-'}</td>
              <td className="px-3 py-2 border border-border text-right">{item.poQty ?? 0}</td>
              {showGrn && <td className="px-3 py-2 border border-border text-right">{item.grnQty ?? 0}</td>}
              {showInvoice && <td className="px-3 py-2 border border-border text-right">{item.invoiceQty ?? 0}</td>}
              {showInvoice && (
                <td className="px-3 py-2 border border-border text-right">
                  {item.invoiceRate ? `₹${item.invoiceRate.toFixed(2)}` : '-'}
                </td>
              )}
              {showInvoice && (
                <td className="px-3 py-2 border border-border text-right">
                  {item.mrp ? `₹${item.mrp.toFixed(2)}` : '-'}
                </td>
              )}
              <td className="px-3 py-2 border border-border">
                {hasIssue(item) ? (
                  <div className="flex flex-wrap gap-1">
                    {item.reasons.map((r, i) => (
                      <span
                        key={i}
                        className="inline-block bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs px-2 py-0.5 rounded"
                      >
                        {formatReason(r)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 text-xs">OK</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
