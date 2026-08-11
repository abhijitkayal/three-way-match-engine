'use client';

import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { formatDate } from '../../lib/constants';

export default function DocumentList({ onSelect, selectedId, refreshKey }) {
  const [documents, setDocuments] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, [refreshKey]);

  async function loadDocuments() {
    try {
      const docs = await apiFetch('/documents');
      console.log(docs);
      setDocuments(docs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = filter
    ? documents.filter((d) => d.documentType === filter)
    : documents;

  const counts = {
    all: documents.length,
    po: documents.filter((d) => d.documentType === 'po').length,
    grn: documents.filter((d) => d.documentType === 'grn').length,
    invoice: documents.filter((d) => d.documentType === 'invoice').length,
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Loading documents...</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      <div className="px-3 py-2 border-b border-border bg-muted/50">
        <div className="flex gap-1">
          {[
            { value: '', label: 'All', count: counts.all },
            { value: 'po', label: 'PO', count: counts.po },
            { value: 'grn', label: 'GRN', count: counts.grn },
            { value: 'invoice', label: 'Invoice', count: counts.invoice },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                filter === tab.value
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {tab.label}
              <span className="ml-1 text-[10px] opacity-60">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground">
          <FileText size={24} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No documents found.</p>
        </div>
      ) : (
        <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
          {filtered.map((doc) => (
            <button
              key={doc._id}
              onClick={() => onSelect(doc)}
              className={`w-full text-left px-4 py-3 hover:bg-muted transition-colors ${
                selectedId === doc._id ? 'bg-primary-50 dark:bg-primary-950 border-l-2 border-primary-500' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                 <span className="text-sm font-medium">
    {doc.documentType === "po"
      ? doc.poNumber
      : doc.documentType === "grn"
      ? doc.grnNumber
      : doc.documentType === "invoice"
      ? doc.invoiceNumber
      : "Unknown"}
  </span>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    doc.documentType === 'po'
                      ? 'bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300'
                      : doc.documentType === 'grn'
                      ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {doc.documentType?.toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatDate(doc.createdAt)}
                {doc.vendorName && ` • ${doc.vendorName}`}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
