'use client';

import { useMemo } from 'react';
import { FileText, TrendingUp, Receipt, Package, Truck, AlertCircle, CheckCircle } from 'lucide-react';
import StatusBadge from '../match/StatusBadge';
import { formatCurrency, formatQty, formatDate, formatReason } from '../../lib/constants';

function StatusPill({ status }) {
  const config = {
    MATCH: { bg: 'bg-emerald-50 dark:bg-emerald-950', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
    PARTIAL: { bg: 'bg-amber-50 dark:bg-amber-950', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
    MISMATCH: { bg: 'bg-red-50 dark:bg-red-950', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-800' },
    PENDING: { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-600 dark:text-zinc-400', border: 'border-zinc-200 dark:border-zinc-700' },
    'NOT AVAILABLE': { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-600 dark:text-zinc-400', border: 'border-zinc-200 dark:border-zinc-700' },
  };
  const c = config[status] || config.PENDING;
  return (
    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${c.bg} ${c.text} ${c.border}`}>
      {status}
    </span>
  );
}

function SeverityBadge({ severity }) {
  const config = {
    HIGH: 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
    MEDIUM: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    LOW: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  };
  return (
    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${config[severity] || config.LOW}`}>
      {severity}
    </span>
  );
}

export default function SummaryTab({ summary, matchData }) {
  const data = useMemo(() => {
    if (!summary || !matchData) return null;

    const po = matchData.documents?.po || null;
    const grns = matchData.documents?.grns || [];
    const invoices = matchData.documents?.invoices || [];
    const items = matchData.items || [];

    const hasPO = !!po;
    const hasGRN = grns.length > 0;
    const hasInvoice = invoices.length > 0;

    const totalPoQty = items.reduce((s, i) => s + (i.poQty || 0), 0);
    const totalReceivedQty = items.reduce((s, i) => s + (i.grnQty || 0), 0);
    const totalInvoiceQty = items.reduce((s, i) => s + (i.invoiceQty || 0), 0);

    const poAmount = items.reduce((s, i) => s + ((i.poQty || 0) * (i.agreedRate || 0)), 0);
    const invoiceAmount = items.reduce((s, i) => s + ((i.invoiceQty || 0) * (i.invoiceRate || 0)), 0);

    const pendingQty = Math.max(0, totalPoQty - totalReceivedQty);
    const fulfillmentPct = totalPoQty > 0 ? ((totalReceivedQty / totalPoQty) * 100) : 0;

    const overallStatus = (() => {
      switch (matchData.status) {
        case 'matched': return 'MATCHED';
        case 'partially_matched': return 'PARTIAL MATCH';
        case 'mismatch': return 'MISMATCH';
        case 'insufficient_documents': return 'PENDING';
        default: return 'PENDING';
      }
    })();

    const issues = [];
    matchData.reasons?.forEach((r) => {
      const severityMap = {
        insufficient_documents: 'HIGH',
        duplicate_po: 'HIGH',
        duplicate_document: 'HIGH',
        item_missing_in_po: 'HIGH',
        invoice_qty_exceeds_po_qty: 'HIGH',
        invoice_qty_exceeds_grn_qty: 'HIGH',
        grn_qty_exceeds_po_qty: 'HIGH',
        invoice_date_after_po_date: 'MEDIUM',
        price_mismatch: 'MEDIUM',
        mrp_mismatch: 'LOW',
        unmapped_master_sku: 'MEDIUM',
      };
      issues.push({
        issue: formatReason(r),
        document: 'All',
        expected: '-',
        actual: '-',
        severity: severityMap[r] || 'LOW',
      });
    });

    items.forEach((item) => {
      item.reasons?.forEach((r) => {
        if (r === 'unmapped_master_sku') {
          issues.push({
            issue: 'SKU is unmapped',
            document: item.erpCode || 'Unknown',
            expected: 'Mapped SKU',
            actual: 'Unmapped',
            severity: 'MEDIUM',
          });
        }
        if (r === 'price_mismatch') {
          issues.push({
            issue: 'Invoice rate differs from PO agreed rate',
            document: item.skuName || item.erpCode,
            expected: formatCurrency(item.agreedRate),
            actual: formatCurrency(item.invoiceRate),
            severity: 'MEDIUM',
          });
        }
        if (r === 'invoice_qty_exceeds_po_qty') {
          issues.push({
            issue: 'Invoice quantity exceeds PO quantity',
            document: item.skuName || item.erpCode,
            expected: `${formatQty(item.poQty)} (PO)`,
            actual: `${formatQty(item.invoiceQty)} (Invoice)`,
            severity: 'HIGH',
          });
        }
        if (r === 'invoice_qty_exceeds_grn_qty') {
          issues.push({
            issue: 'Invoice quantity exceeds received quantity',
            document: item.skuName || item.erpCode,
            expected: `${formatQty(item.grnQty)} (GRN)`,
            actual: `${formatQty(item.invoiceQty)} (Invoice)`,
            severity: 'HIGH',
          });
        }
        if (r === 'grn_qty_exceeds_po_qty') {
          issues.push({
            issue: 'GRN quantity exceeds PO quantity',
            document: item.skuName || item.erpCode,
            expected: `${formatQty(item.poQty)} (PO)`,
            actual: `${formatQty(item.grnQty)} (GRN)`,
            severity: 'HIGH',
          });
        }
        if (r === 'mrp_mismatch') {
          issues.push({
            issue: 'MRP mismatch between documents',
            document: item.skuName || item.erpCode,
            expected: formatCurrency(item.mrp),
            actual: '-',
            severity: 'LOW',
          });
        }
      });
    });

    const uniqueIssues = [];
    const seen = new Set();
    for (const issue of issues) {
      const key = `${issue.issue}|${issue.document}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueIssues.push(issue);
      }
    }

    if (!hasGRN && hasPO) {
      uniqueIssues.push({
        issue: 'Missing GRN',
        document: po.poNumber,
        expected: 'GRN document',
        actual: 'Not received',
        severity: 'HIGH',
      });
    }
    if (!hasInvoice && hasPO) {
      uniqueIssues.push({
        issue: 'Missing Invoice',
        document: po.poNumber,
        expected: 'Invoice document',
        actual: 'Not received',
        severity: 'HIGH',
      });
    }

    const skuMatches = items.map((item) => {
      const poVsGrn = (() => {
        if (!hasGRN) return 'NOT AVAILABLE';
        if (item.poQty === item.grnQty && item.grnQty > 0) return 'MATCH';
        if (item.grnQty === 0) return 'PENDING';
        return 'PARTIAL';
      })();
      const poVsInvoice = (() => {
        if (!hasInvoice) return 'NOT AVAILABLE';
        if (item.invoiceQty === 0) return 'PENDING';
        if (item.poQty !== item.invoiceQty) return 'MISMATCH';
        if (item.agreedRate !== item.invoiceRate && item.agreedRate > 0) return 'MISMATCH';
        return 'MATCH';
      })();
      const grnVsInvoice = (() => {
        if (!hasGRN || !hasInvoice) return 'NOT AVAILABLE';
        if (item.invoiceQty === 0 || item.grnQty === 0) return 'PENDING';
        if (item.grnQty === item.invoiceQty) return 'MATCH';
        return 'MISMATCH';
      })();

      const qtyVariancePoGrn = item.poQty - item.grnQty;
      const qtyVariancePoInvoice = item.poQty - item.invoiceQty;
      const priceVariance = item.invoiceRate - item.agreedRate;
      const priceVariancePct = item.agreedRate > 0
        ? ((item.invoiceRate - item.agreedRate) / item.agreedRate) * 100
        : 0;

      return {
        ...item,
        poVsGrn,
        poVsInvoice,
        grnVsInvoice,
        qtyVariancePoGrn,
        qtyVariancePoInvoice,
        priceVariance,
        priceVariancePct,
      };
    });

    // Build timeline rows for Associated Invoice & GRN table
    const timelineRows = [];
    let cumulativeInvoice = 0;
    let cumulativeGRN = 0;

    // Row 1: Original PO
    if (hasPO) {
      timelineRows.push({
        type: 'Original PO',
        docNo: po.poNumber || '-',
        date: po.poDate || null,
        quantity: totalPoQty,
        cumulativeInvoice: 0,
        cumulativeGRN: 0,
        pendingDelivery: totalPoQty,
        badgeStyle: 'bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300',
      });
    }

    // Sort invoices by date
    const sortedInvoices = [...invoices].sort((a, b) => {
      const da = a.invoiceDate ? new Date(a.invoiceDate).getTime() : 0;
      const db = b.invoiceDate ? new Date(b.invoiceDate).getTime() : 0;
      return da - db;
    });

    // Sort GRNs by date
    const sortedGRNs = [...grns].sort((a, b) => {
      const da = a.grnDate ? new Date(a.grnDate).getTime() : 0;
      const db = b.grnDate ? new Date(b.grnDate).getTime() : 0;
      return da - db;
    });

    // Interleave invoices and GRNs chronologically
    const allDocs = [
      ...sortedInvoices.map(inv => ({ docType: 'invoice', data: inv })),
      ...sortedGRNs.map(grn => ({ docType: 'grn', data: grn })),
    ].sort((a, b) => {
      const dateA = a.docType === 'invoice' ? a.data.invoiceDate : a.data.grnDate;
      const dateB = b.docType === 'invoice' ? b.data.invoiceDate : b.data.grnDate;
      const ta = dateA ? new Date(dateA).getTime() : 0;
      const tb = dateB ? new Date(dateB).getTime() : 0;
      return ta - tb;
    });

    for (const doc of allDocs) {
      if (doc.docType === 'invoice') {
        const inv = doc.data;
        const invQty = (inv.items || []).reduce((s, i) => s + (i.quantity || 0), 0);
        cumulativeInvoice += invQty;
        timelineRows.push({
          type: 'Invoice',
          docNo: inv.invoiceNumber || '-',
          date: inv.invoiceDate || null,
          quantity: invQty,
          cumulativeInvoice,
          cumulativeGRN,
          pendingDelivery: Math.max(0, totalPoQty - cumulativeGRN),
          badgeStyle: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
        });
      } else {
        const grn = doc.data;
        const grnQty = (grn.items || []).reduce((s, i) => s + (i.receivedQuantity || 0), 0);
        cumulativeGRN += grnQty;
        timelineRows.push({
          type: 'GRN',
          docNo: grn.grnNumber || '-',
          date: grn.grnDate || null,
          quantity: grnQty,
          cumulativeInvoice,
          cumulativeGRN,
          pendingDelivery: Math.max(0, totalPoQty - cumulativeGRN),
          badgeStyle: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300',
        });
      }
    }

    // Final row: Current Status
    timelineRows.push({
      type: 'Current Status',
      docNo: '-',
      date: null,
      quantity: null,
      remainingQty: Math.max(0, totalPoQty - cumulativeGRN),
      cumulativeInvoice,
      cumulativeGRN,
      pendingDelivery: Math.max(0, totalPoQty - cumulativeGRN),
      isStatusRow: true,
    });

    return {
      po, grns, invoices, items,
      totalPoQty, totalReceivedQty, totalInvoiceQty,
      poAmount, invoiceAmount,
      pendingQty, fulfillmentPct,
      overallStatus,
      issues: uniqueIssues,
      skuMatches,
      hasPO, hasGRN, hasInvoice,
      timelineRows,
    };
  }, [summary, matchData]);

  if (!data) return null;

  return (
    <div className="space-y-6">

      {/* SECTION 1: HEADER */}
      <div className="bg-card rounded-lg border p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText size={16} className="text-muted-foreground" />
              <h2 className="text-lg font-bold">{data.po?.poNumber || summary.poNumber}</h2>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {data.po?.vendorName && <span>Vendor: <span className="font-medium text-foreground">{data.po.vendorName}</span></span>}
              {data.po?.poDate && <span>PO Date: <span className="font-medium text-foreground">{formatDate(data.po.poDate)}</span></span>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Overall Status</p>
              <StatusBadge status={matchData.status} size="md" />
            </div>
            {data.issues.length > 0 && (
              <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg px-3 py-1.5">
                <AlertCircle size={14} className="text-red-600 dark:text-red-400" />
                <span className="text-xs font-semibold text-red-700 dark:text-red-300">
                  {data.issues.length} issue{data.issues.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary-100 dark:bg-primary-900">
            <Receipt size={22} className="text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">PO Amount</p>
            <p className="text-xl font-bold mt-0.5">{data.hasPO ? formatCurrency(data.poAmount) : 'N/A'}</p>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900">
            <TrendingUp size={22} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Invoice Amount</p>
            <p className="text-xl font-bold mt-0.5">{data.hasInvoice ? formatCurrency(data.invoiceAmount) : 'N/A'}</p>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
            <Package size={22} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total PO Quantity</p>
            <p className="text-xl font-bold mt-0.5">{data.hasPO ? formatQty(data.totalPoQty) : 'N/A'}</p>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900">
            <Truck size={22} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total Received Quantity</p>
            <p className="text-xl font-bold mt-0.5">{data.hasGRN ? formatQty(data.totalReceivedQty) : 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* SECTION 3: FULFILLMENT / DELIVERY SUMMARY */}
      <div className="bg-card rounded-lg border p-5">
        <h3 className="text-sm font-semibold mb-4">Fulfillment / Delivery Summary</h3>
        {!data.hasPO ? (
          <p className="text-sm text-muted-foreground">Purchase Order data unavailable</p>
        ) : !data.hasGRN ? (
          <p className="text-sm text-muted-foreground">GRN not received</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">PO Quantity</p>
                <p className="text-lg font-bold mt-0.5">{formatQty(data.totalPoQty)}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Received Quantity</p>
                <p className="text-lg font-bold mt-0.5 text-emerald-600 dark:text-emerald-400">{formatQty(data.totalReceivedQty)}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Pending Quantity</p>
                <p className={`text-lg font-bold mt-0.5 ${data.pendingQty > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {formatQty(data.pendingQty)}
                </p>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Fulfillment</p>
                <p className="text-sm font-bold">{data.fulfillmentPct.toFixed(2)}%</p>
              </div>
              <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, data.fulfillmentPct)}%`,
                    backgroundColor: data.fulfillmentPct >= 100 ? '#10b981' : data.fulfillmentPct >= 50 ? '#f59e0b' : '#ef4444',
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4: ASSOCIATED INVOICE & GRN */}
      <div className="bg-card rounded-lg border">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">Associated Invoice & GRN</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-3 py-2.5 font-semibold uppercase tracking-wider text-muted-foreground border-b border-r border-border">Document Type</th>
                <th className="text-left px-3 py-2.5 font-semibold uppercase tracking-wider text-muted-foreground border-b border-r border-border">Document No.</th>
                <th className="text-left px-3 py-2.5 font-semibold uppercase tracking-wider text-muted-foreground border-b border-r border-border">Date</th>
                <th className="text-right px-3 py-2.5 font-semibold uppercase tracking-wider text-muted-foreground border-b border-r border-border">Quantity</th>
                <th className="text-right px-3 py-2.5 font-semibold uppercase tracking-wider text-muted-foreground border-b border-r border-border">Cumulative Invoice</th>
                <th className="text-right px-3 py-2.5 font-semibold uppercase tracking-wider text-muted-foreground border-b border-r border-border">Cumulative GRN</th>
                <th className="text-right px-3 py-2.5 font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">Pending Delivery</th>
              </tr>
            </thead>
            <tbody>
              {data.timelineRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground text-sm">
                    No documents found.
                  </td>
                </tr>
              ) : (
                data.timelineRows.map((row, idx) => {
                  if (row.isStatusRow) {
                    return (
                      <tr key={`status-${idx}`} className="bg-primary-50/50 dark:bg-primary-950/50 font-semibold">
                        <td className="px-3 py-2.5 border-b border-r border-border">
                          <span className="text-xs font-bold text-primary-700 dark:text-primary-300">Current Status</span>
                        </td>
                        <td className="px-3 py-2.5 border-b border-r border-border text-muted-foreground">-</td>
                        <td className="px-3 py-2.5 border-b border-r border-border text-muted-foreground">-</td>
                        <td className="px-3 py-2.5 border-b border-r border-border text-right">
                          <span className="text-primary-700 dark:text-primary-300">Remaining: {formatQty(row.remainingQty)}</span>
                        </td>
                        <td className="px-3 py-2.5 border-b border-r border-border text-right">
                          <span className="font-bold">{formatQty(row.cumulativeInvoice)}</span>
                        </td>
                        <td className="px-3 py-2.5 border-b border-r border-border text-right">
                          <span className="font-bold">{formatQty(row.cumulativeGRN)}</span>
                        </td>
                        <td className="px-3 py-2.5 border-b border-border text-right">
                          <span className={`font-bold ${row.pendingDelivery > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {formatQty(row.pendingDelivery)}
                          </span>
                        </td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={`${row.type}-${idx}`} className="hover:bg-muted/50 transition-colors">
                      <td className="px-3 py-2.5 border-b border-r border-border">
                        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${row.badgeStyle}`}>
                          {row.type}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 border-b border-r border-border font-medium">{row.docNo}</td>
                      <td className="px-3 py-2.5 border-b border-r border-border text-muted-foreground">{formatDate(row.date)}</td>
                      <td className="px-3 py-2.5 border-b border-r border-border text-right tabular-nums">{formatQty(row.quantity)}</td>
                      <td className="px-3 py-2.5 border-b border-r border-border text-right tabular-nums">
                        <span className={row.cumulativeInvoice > 0 ? 'font-medium' : 'text-muted-foreground'}>
                          {formatQty(row.cumulativeInvoice)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 border-b border-r border-border text-right tabular-nums">
                        <span className={row.cumulativeGRN > 0 ? 'font-medium' : 'text-muted-foreground'}>
                          {formatQty(row.cumulativeGRN)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 border-b border-border text-right tabular-nums">
                        <span className={row.pendingDelivery > 0 ? 'font-medium text-amber-600 dark:text-amber-400' : 'font-medium text-emerald-600 dark:text-emerald-400'}>
                          {formatQty(row.pendingDelivery)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 5: THREE-WAY MATCH RESULT */}
      <div className="bg-card rounded-lg border p-5">
        <h3 className="text-sm font-semibold mb-4">Three-Way Match</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* PO vs GRN */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded">PO</span>
              <span className="text-muted-foreground text-xs">vs</span>
              <span className="text-xs font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded">GRN</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity</span>
                <span className="font-medium">
                  {data.hasGRN ? `${formatQty(data.totalReceivedQty)} / ${formatQty(data.totalPoQty)}` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SKU</span>
                <span className="font-medium">
                  {data.skuMatches.length > 0
                    ? `${data.skuMatches.filter(s => s.poVsGrn === 'MATCH').length}/${data.skuMatches.length} matched`
                    : 'N/A'}
                </span>
              </div>
            </div>
            <div className="pt-1 border-t">
              {data.hasGRN ? (
                <StatusPill
                  status={data.totalReceivedQty === data.totalPoQty ? 'MATCH' : data.totalReceivedQty > 0 ? 'PARTIAL' : 'PENDING'}
                />
              ) : (
                <StatusPill status="NOT AVAILABLE" />
              )}
            </div>
          </div>

          {/* PO vs Invoice */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded">PO</span>
              <span className="text-muted-foreground text-xs">vs</span>
              <span className="text-xs font-semibold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded">Invoice</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity</span>
                <span className="font-medium">
                  {data.hasInvoice ? `${formatQty(data.totalInvoiceQty)} / ${formatQty(data.totalPoQty)}` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price</span>
                <span className="font-medium">
                  {data.hasInvoice && data.skuMatches.length > 0
                    ? `${formatCurrency(data.skuMatches[0]?.invoiceRate || 0)} / ${formatCurrency(data.skuMatches[0]?.agreedRate || 0)}`
                    : 'N/A'}
                </span>
              </div>
            </div>
            <div className="pt-1 border-t">
              {data.hasInvoice ? (
                <StatusPill
                  status={
                    data.skuMatches.every(s => s.poVsInvoice === 'MATCH') ? 'MATCH' :
                    data.skuMatches.some(s => s.poVsInvoice === 'MISMATCH') ? 'MISMATCH' :
                    data.skuMatches.some(s => s.poVsInvoice === 'PARTIAL') ? 'PARTIAL' : 'PENDING'
                  }
                />
              ) : (
                <StatusPill status="NOT AVAILABLE" />
              )}
            </div>
          </div>

          {/* GRN vs Invoice */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded">GRN</span>
              <span className="text-muted-foreground text-xs">vs</span>
              <span className="text-xs font-semibold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded">Invoice</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity</span>
                <span className="font-medium">
                  {data.hasGRN && data.hasInvoice
                    ? `${formatQty(data.totalReceivedQty)} / ${formatQty(data.totalInvoiceQty)}`
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SKU</span>
                <span className="font-medium">
                  {data.hasGRN && data.hasInvoice
                    ? `${data.skuMatches.filter(s => s.grnVsInvoice === 'MATCH').length}/${data.skuMatches.length} matched`
                    : 'N/A'}
                </span>
              </div>
            </div>
            <div className="pt-1 border-t">
              {data.hasGRN && data.hasInvoice ? (
                <StatusPill
                  status={
                    data.skuMatches.every(s => s.grnVsInvoice === 'MATCH') ? 'MATCH' :
                    data.skuMatches.some(s => s.grnVsInvoice === 'MISMATCH') ? 'MISMATCH' : 'MATCH'
                  }
                />
              ) : (
                <StatusPill status="NOT AVAILABLE" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 6: SKU-LEVEL MATCHING */}
      {/* <div className="bg-card rounded-lg border">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">SKU-Level Matching</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground border-b border-r border-border">SKU</th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground border-b border-r border-border">SKU Name</th>
                <th className="text-right px-3 py-2.5 font-medium text-muted-foreground border-b border-r border-border">PO Qty</th>
                <th className="text-right px-3 py-2.5 font-medium text-muted-foreground border-b border-r border-border">Received Qty</th>
                <th className="text-right px-3 py-2.5 font-medium text-muted-foreground border-b border-r border-border">Invoice Qty</th>
                <th className="text-right px-3 py-2.5 font-medium text-muted-foreground border-b border-r border-border">PO Rate</th>
                <th className="text-right px-3 py-2.5 font-medium text-muted-foreground border-b border-r border-border">Invoice Rate</th>
                <th className="text-right px-3 py-2.5 font-medium text-muted-foreground border-b border-r border-border">MRP</th>
                <th className="text-right px-3 py-2.5 font-medium text-muted-foreground border-b border-r border-border">Qty Variance</th>
                <th className="text-right px-3 py-2.5 font-medium text-muted-foreground border-b border-r border-border">Price Variance</th>
                <th className="text-center px-3 py-2.5 font-medium text-muted-foreground border-b">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.skuMatches.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-6 text-center text-muted-foreground text-sm">
                    No SKU items found.
                  </td>
                </tr>
              ) : (
                data.skuMatches.map((item, idx) => {
                  const hasIssue = item.reasons && item.reasons.length > 0;
                  let itemStatus = 'MATCH';
                  let itemStatusColor = 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950';
                  if (!item.skuName) {
                    itemStatus = 'Unmapped';
                    itemStatusColor = 'text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800';
                  } else if (hasIssue) {
                    if (item.reasons.includes('invoice_qty_exceeds_po_qty') || item.reasons.includes('invoice_qty_exceeds_grn_qty')) {
                      itemStatus = 'Qty Mismatch';
                      itemStatusColor = 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950';
                    } else if (item.reasons.includes('price_mismatch')) {
                      itemStatus = 'Rate Mismatch';
                      itemStatusColor = 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950';
                    } else {
                      itemStatus = 'Mismatch';
                      itemStatusColor = 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950';
                    }
                  } else if (item.poQty > 0 && item.grnQty < item.poQty) {
                    itemStatus = 'Pending';
                    itemStatusColor = 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950';
                  }
                  return (
                    <tr key={idx} className={`${hasIssue ? 'bg-amber-50/50 dark:bg-amber-950/50' : ''} hover:bg-muted/50`}>
                      <td className="px-3 py-2 border-b border-r border-border font-medium">{item.erpCode || '-'}</td>
                      <td className="px-3 py-2 border-b border-r border-border">
                        {item.skuName || <span className="text-muted-foreground italic">Unmapped SKU</span>}
                      </td>
                      <td className="px-3 py-2 border-b border-r border-border text-right">{item.poQty || 0}</td>
                      <td className="px-3 py-2 border-b border-r border-border text-right">
                        {data.hasGRN ? (item.grnQty || 0) : <span className="text-muted-foreground">-</span>}
                      </td>
                      <td className="px-3 py-2 border-b border-r border-border text-right">
                        {data.hasInvoice ? (item.invoiceQty || 0) : <span className="text-muted-foreground">-</span>}
                      </td>
                      <td className="px-3 py-2 border-b border-r border-border text-right">
                        {item.agreedRate ? formatCurrency(item.agreedRate) : '-'}
                      </td>
                      <td className="px-3 py-2 border-b border-r border-border text-right">
                        {item.invoiceRate ? formatCurrency(item.invoiceRate) : '-'}
                      </td>
                      <td className="px-3 py-2 border-b border-r border-border text-right">
                        {item.mrp ? formatCurrency(item.mrp) : '-'}
                      </td>
                      <td className="px-3 py-2 border-b border-r border-border text-right">
                        {data.hasGRN ? (
                          <span className={item.qtyVariancePoGrn > 0 ? 'text-amber-600 dark:text-amber-400' : item.qtyVariancePoGrn < 0 ? 'text-red-600 dark:text-red-400' : ''}>
                            {item.qtyVariancePoGrn > 0 ? `+${item.qtyVariancePoGrn}` : item.qtyVariancePoGrn}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-3 py-2 border-b border-r border-border text-right">
                        {item.invoiceRate > 0 && item.agreedRate > 0 ? (
                          <span className={Math.abs(item.priceVariancePct) > 5 ? 'text-amber-600 dark:text-amber-400' : ''}>
                            {item.priceVariancePct > 0 ? '+' : ''}{item.priceVariancePct.toFixed(1)}%
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-3 py-2 border-b text-center">
                        <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${itemStatusColor}`}>
                          {itemStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div> */}

      {/* SECTION 8: ISSUES DETECTED */}
      {/* {data.issues.length > 0 && (
        <div className="bg-card rounded-lg border">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold">Issues Detected</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground border-b">Issue</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground border-b">Document / SKU</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground border-b">Expected</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground border-b">Actual</th>
                  <th className="text-center px-4 py-2.5 font-medium text-muted-foreground border-b">Severity</th>
                </tr>
              </thead>
              <tbody>
                {data.issues.map((issue, idx) => (
                  <tr key={idx} className="hover:bg-muted/50">
                    <td className="px-4 py-2.5 border-b font-medium">{issue.issue}</td>
                    <td className="px-4 py-2.5 border-b text-muted-foreground">{issue.document}</td>
                    <td className="px-4 py-2.5 border-b text-muted-foreground">{issue.expected}</td>
                    <td className="px-4 py-2.5 border-b text-muted-foreground">{issue.actual}</td>
                    <td className="px-4 py-2.5 border-b text-center"><SeverityBadge severity={issue.severity} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )} */}

      {/* Empty state when no issues */}
      {data.issues.length === 0 && (
        <div className="bg-card rounded-lg border p-5">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle size={16} />
            <span className="text-sm font-semibold">No issues detected</span>
          </div>
        </div>
      )}

    </div>
  );
}
