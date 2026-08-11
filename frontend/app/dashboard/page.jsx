'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Upload from '@/components/Upload';
import { apiFetch } from '@/lib/api';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default function DashboardPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadDocuments();
  }, [router]);

  async function loadDocuments() {
    try {
      const docs = await apiFetch('/documents');
      setDocuments(docs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const poNumbers = [...new Set(documents.filter(d => d.poNumber).map(d => d.poNumber))];

  function handleSelectPo(poNumber) {
    router.push(`/match/${poNumber}`);
  }

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)"
      }}>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
              <h1 className="text-2xl font-bold">Dashboard</h1>

              <Upload onUploaded={loadDocuments} />

              {loading ? (
                <p className="text-muted-foreground">Loading documents...</p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1">
                    <div className="bg-card rounded-lg shadow-sm border p-4">
                      <h2 className="font-medium mb-3">Purchase Orders</h2>
                      {poNumbers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No POs found. Upload a PO to start.</p>
                      ) : (
                        <div className="space-y-2">
                          {poNumbers.map(po => {
                            const docs = documents.filter(d => d.poNumber === po);
                            const grnCount = docs.filter(d => d.documentType === 'grn').length;
                            const invoiceCount = docs.filter(d => d.documentType === 'invoice').length;
                            return (
                              <button
                                key={po}
                                onClick={() => handleSelectPo(po)}
                                className="w-full text-left p-3 rounded border text-sm border-border hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950 transition-colors"
                              >
                                <div className="font-medium">{po}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  GRNs: {grnCount} | Invoices: {invoiceCount}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* <div className="lg:col-span-2">
                    <div className="bg-card rounded-lg shadow-sm border p-8 text-center text-muted-foreground">
                      Select a PO to view match details
                    </div>
                  </div> */}
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
