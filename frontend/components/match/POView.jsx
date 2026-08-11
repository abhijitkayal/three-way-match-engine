'use client';

import DocumentPreview from './DocumentPreview';
import { formatDate } from '../../lib/constants';

export default function POView({ poDocument }) {
  if (!poDocument) {
    return (
      <div className="bg-card rounded-lg border p-6 text-center text-muted-foreground">
        No PO document found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="border-l-4 border-primary-500 p-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Purchase Order</h4>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">PO Number</label>
              <p className="text-sm font-semibold">{poDocument.poNumber || '-'}</p>
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">PO Date</label>
              <p className="text-sm">{formatDate(poDocument.poDate)}</p>
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Vendor</label>
              <p className="text-sm">{poDocument.vendorName || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border p-4">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Original Document</h4>
        <DocumentPreview documentId={poDocument._id} filePath={poDocument.filePath} />
      </div>
    </div>
  );
}
