'use client';

import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import DocumentList from '../../components/documents/DocumentList';
import DocumentPreview from '../../components/match/DocumentPreview';
import { formatDate } from '../../lib/constants';

export default function DocumentsPage() {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function handleUploaded() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold">Documents</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Browse and view uploaded documents</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <DocumentList
              onSelect={setSelectedDoc}
              selectedId={selectedDoc?._id}
              refreshKey={refreshKey}
            />
          </div>

          <div className="lg:col-span-2">
            {!selectedDoc ? (
              <div className="bg-card rounded-lg border p-12 text-center text-muted-foreground">
                <p className="text-sm">Select a document to view details</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-card rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">
  {selectedDoc.documentType === "po" &&
    `PO - ${selectedDoc.poNumber}`}

  {selectedDoc.documentType === "grn" &&
    `GRN - ${selectedDoc.grnNumber}`}

  {selectedDoc.documentType === "invoice" &&
    `INV - ${selectedDoc.invoiceNumber}`}
</h3>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        selectedDoc.documentType === 'po'
                          ? 'bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300'
                          : selectedDoc.documentType === 'grn'
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {selectedDoc.documentType?.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {selectedDoc.vendorName && <div>Vendor: {selectedDoc.vendorName}</div>}
                    {selectedDoc.poDate && <div>PO Date: {formatDate(selectedDoc.poDate)}</div>}
                    {selectedDoc.grnDate && <div>GRN Date: {formatDate(selectedDoc.grnDate)}</div>}
                    {selectedDoc.invoiceDate && <div>Invoice Date: {formatDate(selectedDoc.invoiceDate)}</div>}
                    <div>Items: {selectedDoc.items?.length || 0}</div>
                  </div>
                </div>

                {selectedDoc.filePath && (
                  <div className="bg-card rounded-lg border p-4">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Original Document
                    </h4>
                    <DocumentPreview
                      documentId={selectedDoc._id}
                      filePath={selectedDoc.filePath}
                    />
                  </div>
                )}

                {selectedDoc.items?.length > 0 && (
                  <div className="bg-card rounded-lg border">
                    <div className="px-4 py-3 border-b border-border">
                      <h4 className="text-sm font-semibold">
                        Items ({selectedDoc.items.length})
                      </h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground border-b">#</th>
                            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground border-b">Code</th>
                            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground border-b">Description</th>
                            <th className="text-right px-4 py-2.5 font-medium text-muted-foreground border-b">Qty</th>
                            <th className="text-right px-4 py-2.5 font-medium text-muted-foreground border-b">Rate</th>
                            <th className="text-right px-4 py-2.5 font-medium text-muted-foreground border-b">MRP</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedDoc.items.map((item, idx) => (
                            <tr key={item._id || idx} className="hover:bg-muted/50">
                              <td className="px-4 py-2.5 border-b text-muted-foreground">{idx + 1}</td>
                              <td className="px-4 py-2.5 border-b font-mono text-xs">{item.itemCode || '-'}</td>
                              <td className="px-4 py-2.5 border-b">{item.description || '-'}</td>
                              <td className="px-4 py-2.5 border-b text-right">
                                {item.quantity ?? item.receivedQuantity ?? 0}
                              </td>
                              <td className="px-4 py-2.5 border-b text-right">
                                {item.unitRate != null ? Number(item.unitRate).toFixed(2) : '-'}
                              </td>
                              <td className="px-4 py-2.5 border-b text-right">
                                {item.mrp != null ? Number(item.mrp).toFixed(2) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
