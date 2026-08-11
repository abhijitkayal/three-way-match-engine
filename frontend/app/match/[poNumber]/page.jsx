'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, FileText, Package, Truck, BarChart3 } from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import StatusBadge from '../../../components/match/StatusBadge';
import ComparisonTable from '../../../components/match/ComparisonTable';
import POView from '../../../components/match/POView';
import InvoiceView from '../../../components/match/InvoiceView';
import GrnView from '../../../components/match/GrnView';
import SummaryCards from '../../../components/summary/SummaryCards';
import AssociatedDocumentsTable from '../../../components/summary/AssociatedDocumentsTable';
import Upload from '../../../components/documents/Upload';
import { apiFetch } from '../../../lib/api';
import { formatCurrency } from '../../../lib/constants';

export default function MatchPage() {
  const router = useRouter();
  const params = useParams();
  const poNumber = params.poNumber;

  const [matchData, setMatchData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('po');
  const [selectedInvoiceIdx, setSelectedInvoiceIdx] = useState(0);
  const [selectedGrnIdx, setSelectedGrnIdx] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadData();
  }, [poNumber, router]);

  async function loadData() {
    setLoading(true);
    try {
      const [match, summ] = await Promise.all([
        apiFetch(`/match/${poNumber}`),
        apiFetch(`/summary/${poNumber}`),
      ]);
      setMatchData(match);
      setSummary(summ);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const invoices = matchData?.documents?.invoices || [];
  const grns = matchData?.documents?.grns || [];
  const poDocument = matchData?.documents?.po || null;

  const tabs = [
    { id: 'po', label: 'Purchase Order', count: 1, icon: FileText },
    { id: 'fulfillment', label: 'Fulfillment', count: invoices.length, icon: Package },
    { id: 'delivery', label: 'Delivery', count: grns.length, icon: Truck },
    { id: 'summary', label: 'Summary', count: null, icon: BarChart3 },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Loading match data...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!matchData) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <FileText size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Match data not found for {poNumber}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 text-sm text-primary-600 hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{poNumber}</h1>
            <div className="flex items-center gap-3 mt-1">
              <StatusBadge status={matchData.status} size="md" />
              {matchData.reasons?.length > 0 && (
                <span className="text-xs text-red-600 dark:text-red-400">
                  {matchData.reasons.length} issue{matchData.reasons.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <Upload onUploaded={loadData} />
        </div>

        <div className="border-b border-border">
          <nav className="flex gap-0 -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                  {tab.count != null && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                        activeTab === tab.id
                          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-muted-foreground'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {activeTab === 'po' && (
          <div className="space-y-6">
            <POView poDocument={poDocument} />
            <div className="bg-card rounded-lg border">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold">Item Comparison</h3>
              </div>
              <div className="p-4">
                <ComparisonTable items={matchData.items || []} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fulfillment' && (
          <div className="space-y-6">
            {/* Fulfillment Summary Cards */}
            {matchData.items && matchData.items.length > 0 && (() => {
              const totalOrdered = matchData.items.reduce((s, i) => s + (i.poQty || 0), 0);
              const totalReceived = matchData.items.reduce((s, i) => s + (i.grnQty || 0), 0);
              const totalInvoiced = matchData.items.reduce((s, i) => s + (i.invoiceQty || 0), 0);
              const pending = Math.max(0, totalOrdered - totalReceived);
              const overDelivered = Math.max(0, totalReceived - totalOrdered);
              const fulfillmentPct = totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;
              const hasGrn = grns.length > 0;

              let statusLabel = 'Pending';
              let statusColor = 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800';
              if (overDelivered > 0) {
                statusLabel = 'Over-delivered';
                statusColor = 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800';
              } else if (totalReceived >= totalOrdered && totalOrdered > 0) {
                statusLabel = 'Fulfilled';
                statusColor = 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800';
              }

              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Fulfillment Summary</h3>
                    <span className={`text-xs font-medium px-3 py-1 rounded-full border ${statusColor}`}>
                      {statusLabel}: {totalReceived} / {totalOrdered} units received
                      {pending > 0 && ` · ${pending} pending`}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="bg-card rounded-lg border p-4">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Ordered</p>
                      <p className="text-xl font-bold mt-1">{totalOrdered}</p>
                    </div>
                    <div className="bg-card rounded-lg border p-4">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Received</p>
                      <p className="text-xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{hasGrn ? totalReceived : '-'}</p>
                      {!hasGrn && <p className="text-[10px] text-muted-foreground mt-0.5">GRN not available</p>}
                    </div>
                    <div className="bg-card rounded-lg border p-4">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Invoiced</p>
                      <p className="text-xl font-bold mt-1 text-amber-600 dark:text-amber-400">{totalInvoiced}</p>
                    </div>
                    <div className="bg-card rounded-lg border p-4">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Fulfillment</p>
                      <p className="text-xl font-bold mt-1">{hasGrn ? `${fulfillmentPct}%` : '-'}</p>
                    </div>
                    <div className="bg-card rounded-lg border p-4">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Pending</p>
                      <p className="text-xl font-bold mt-1 text-amber-600 dark:text-amber-400">{hasGrn ? pending : '-'}</p>
                      {overDelivered > 0 && (
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">Over: {overDelivered}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

 <InvoiceView
              invoice={invoices[selectedInvoiceIdx] || invoices[0]}
              matchReasons={matchData.reasons || []}
              matchItems={matchData.items || []}
            />
            {/* Three-Way Comparison Table */}
            {matchData.items && matchData.items.length > 0 && (
              <div className="bg-card rounded-lg border">
                <div className="px-4 py-3 border-b border-border">
                  <h4 className="text-sm font-semibold">Three-Way Comparison</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left px-3 py-2.5 border-b border-r border-border font-semibold">Item</th>
                        <th className="text-right px-3 py-2.5 border-b border-r border-border font-semibold">PO Qty</th>
                        <th className="text-right px-3 py-2.5 border-b border-r border-border font-semibold">GRN Qty</th>
                        <th className="text-right px-3 py-2.5 border-b border-r border-border font-semibold">Invoice Qty</th>
                        <th className="text-right px-3 py-2.5 border-b border-r border-border font-semibold">PO Rate</th>
                        <th className="text-right px-3 py-2.5 border-b border-r border-border font-semibold">Invoice Rate</th>
                        <th className="text-left px-3 py-2.5 border-b border-border font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matchData.items.map((item, idx) => {
                        const hasIssue = item.reasons && item.reasons.length > 0;
                        let itemStatus = 'Matched';
                        let itemStatusColor = 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950';
                        if (!item.skuName) {
                          itemStatus = 'Unmapped SKU';
                          itemStatusColor = 'text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800';
                        } else if (hasIssue) {
                          if (item.reasons.includes('invoice_qty_exceeds_po_qty') || item.reasons.includes('invoice_qty_exceeds_grn_qty')) {
                            itemStatus = 'Qty Mismatch';
                            itemStatusColor = 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950';
                          } else if (item.reasons.includes('price_mismatch')) {
                            itemStatus = 'Rate Mismatch';
                            itemStatusColor = 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950';
                          } else if (item.reasons.includes('mrp_mismatch')) {
                            itemStatus = 'MRP Mismatch';
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
                            <td className="px-3 py-2 border-b border-r border-border">
                              <div className="font-medium">{item.skuName || 'Unmapped SKU'}</div>
                              <div className="text-muted-foreground">{item.erpCode || '-'}</div>
                            </td>
                            <td className="px-3 py-2 border-b border-r border-border text-right">{item.poQty || 0}</td>
                            <td className="px-3 py-2 border-b border-r border-border text-right">{grns.length > 0 ? (item.grnQty || 0) : <span className="text-muted-foreground">-</span>}</td>
                            <td className="px-3 py-2 border-b border-r border-border text-right">{item.invoiceQty || 0}</td>
                            <td className="px-3 py-2 border-b border-r border-border text-right">{item.agreedRate ? formatCurrency(item.agreedRate) : '-'}</td>
                            <td className="px-3 py-2 border-b border-r border-border text-right">
                              {item.invoiceRate ? (
                                <span className={item.reasons?.includes('price_mismatch') ? 'text-amber-600 dark:text-amber-400 font-semibold' : ''}>
                                  {formatCurrency(item.invoiceRate)}
                                </span>
                              ) : '-'}
                            </td>
                            
                            <td className="px-3 py-2 border-b border-border">
                              <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${itemStatusColor}`}>
                                {itemStatus}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Invoice Selector & Details */}
            {invoices.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {invoices.map((inv, idx) => (
                  <button
                    key={inv._id || idx}
                    onClick={() => setSelectedInvoiceIdx(idx)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                      selectedInvoiceIdx === idx
                        ? 'bg-amber-50 dark:bg-amber-950 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                        : 'border-border text-muted-foreground hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {inv.invoiceNumber || `Invoice ${idx + 1}`}
                  </button>
                ))}
              </div>
            )}

           
          </div>
        )}

        {activeTab === 'delivery' && (
          <div className="space-y-6">
            {grns.length === 0 ? (
              <div className="space-y-6">
                {/* Delivery Summary - No GRN */}
                {matchData.items && matchData.items.length > 0 && (() => {
                  const totalOrdered = matchData.items.reduce((s, i) => s + (i.poQty || 0), 0);
                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Delivery Summary</h3>
                        <span className="text-xs font-medium px-3 py-1 rounded-full border text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                          Not Delivered: 0 / {totalOrdered} units
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="bg-card rounded-lg border p-4">
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Ordered</p>
                          <p className="text-xl font-bold mt-1">{totalOrdered}</p>
                        </div>
                        <div className="bg-card rounded-lg border p-4">
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Received</p>
                          <p className="text-xl font-bold mt-1 text-muted-foreground">0</p>
                        </div>
                        <div className="bg-card rounded-lg border p-4">
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Pending</p>
                          <p className="text-xl font-bold mt-1 text-amber-600 dark:text-amber-400">{totalOrdered}</p>
                        </div>
                        <div className="bg-card rounded-lg border p-4">
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Delivery</p>
                          <p className="text-xl font-bold mt-1">0%</p>
                        </div>
                        <div className="bg-card rounded-lg border p-4">
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Over Delivered</p>
                          <p className="text-xl font-bold mt-1 text-muted-foreground">0</p>
                        </div>
                      </div>

                    </>
                  );
                })()}
                <div className="bg-card rounded-lg border p-8 text-center text-muted-foreground">
                  <Truck size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">No delivery received yet.</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Upload a GRN document to track delivery status</p>
                </div>
              </div>
            ) : (
              <>
                {/* GRN Selector */}
                {grns.length > 1 && (
                  <div className="flex gap-2 flex-wrap">
                    {grns.map((grn, idx) => (
                      <button
                        key={grn._id || idx}
                        onClick={() => setSelectedGrnIdx(idx)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                          selectedGrnIdx === idx
                            ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                            : 'border-border text-muted-foreground hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                        }`}
                      >
                        GRN: {grn.grnNumber || `GRN ${idx + 1}`} Raised
                      </button>
                    ))}
                  </div>
                )}

                {/* GRN View with PO Document */}
                <GrnView
                  grn={grns[selectedGrnIdx] || grns[0]}
                  poDocument={poDocument}
                  matchItems={matchData.items || []}
                  matchReasons={matchData.reasons || []}
                  allGrns={grns}
                />
              </>
            )}
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="space-y-6">
            <SummaryCards summary={summary} />
            <AssociatedDocumentsTable summary={summary} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
