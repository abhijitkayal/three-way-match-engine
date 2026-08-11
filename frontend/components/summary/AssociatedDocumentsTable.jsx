'use client';

import { formatQty, formatDate } from '../../lib/constants';
import StatusBadge from '../match/StatusBadge';

export default function AssociatedDocumentsTable({ summary }) {
  if (!summary) return null;

  const totalPoQty = summary.totalPoQty ?? 0;
  const receivedQty = summary.cumulativeReceivedQty ?? 0;
  const pendingDelivery = summary.pendingDelivery ?? 0;
  const grns = summary.documents?.grns || [];
  const invoices = summary.documents?.invoices || [];

  const allDocs = [
    ...grns.map((g) => ({
      id: g._id,
      number: g.grnNumber,
      type: 'GRN',
      date: g.grnDate,
      receivedQty: g.cumulativeReceivedQty,
      status: g.status,
    })),
    ...invoices.map((inv) => ({
      id: inv._id,
      number: inv.invoiceNumber,
      type: 'Invoice',
      date: inv.invoiceDate,
      invoicedQty: inv.cumulativeInvoicedQty,
      status: inv.status,
    })),
  ];

  return (
    <div className="bg-card rounded-lg border">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">Associated Invoice & GRN</h3>
      </div>

      <div className="px-4 py-3 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Total PO Qty: </span>
            <span className="font-semibold">{formatQty(totalPoQty)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Received: </span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatQty(receivedQty)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Pending Delivery: </span>
            <span className={`font-semibold ${pendingDelivery > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {formatQty(pendingDelivery)}
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground border-b">Document</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground border-b">Type</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground border-b">Date</th>
              <th className="text-right px-4 py-2.5 font-medium text-muted-foreground border-b">Invoiced Qty</th>
              <th className="text-right px-4 py-2.5 font-medium text-muted-foreground border-b">Received Qty</th>
              <th className="text-center px-4 py-2.5 font-medium text-muted-foreground border-b">Status</th>
            </tr>
          </thead>
          <tbody>
            {allDocs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground text-sm">
                  No associated documents found.
                </td>
              </tr>
            ) : (
              allDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-muted/50">
                  <td className="px-4 py-2.5 border-b font-medium">{doc.number}</td>
                  <td className="px-4 py-2.5 border-b">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        doc.type === 'GRN'
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {doc.type}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 border-b text-muted-foreground">{formatDate(doc.date)}</td>
                  <td className="px-4 py-2.5 border-b text-right text-muted-foreground">
                    {doc.invoicedQty != null ? formatQty(doc.invoicedQty) : '-'}
                  </td>
                  <td className="px-4 py-2.5 border-b text-right text-muted-foreground">
                    {doc.receivedQty != null ? formatQty(doc.receivedQty) : '-'}
                  </td>
                  <td className="px-4 py-2.5 border-b text-center">
                    {doc.status ? (
                      <StatusBadge status={doc.status} size="sm" />
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
