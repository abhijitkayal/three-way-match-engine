export const REASON_LABELS = {
  grn_qty_exceeds_po_qty: 'GRN quantity exceeds PO quantity',
  invoice_qty_exceeds_grn_qty: 'Invoice quantity exceeds GRN quantity',
  invoice_qty_exceeds_po_qty: 'Invoice quantity exceeds PO quantity',
  invoice_date_after_po_date: 'Invoice date is after PO date',
  duplicate_po: 'Duplicate purchase order',
  duplicate_document: 'Duplicate document',
  item_missing_in_po: 'Item is missing in PO',
  price_mismatch: 'Price mismatch',
  mrp_mismatch: 'MRP mismatch',
  unmapped_master_sku: 'SKU could not be mapped',
};

export function formatReason(reason) {
  return REASON_LABELS[reason] || reason.replace(/_/g, ' ');
}

export function formatCurrency(amount) {
  if (amount == null) return '-';
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatQty(qty) {
  if (qty == null) return '-';
  return Number(qty).toLocaleString('en-IN');
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
