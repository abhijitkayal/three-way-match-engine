'use client';

import { useEffect, useState } from 'react';
import { formatQty, formatCurrency } from '../../lib/constants';
import { apiFetch } from '../../lib/api';

export default function FulfillmentItemsTable({ poDocument, invoice, grn }) {
  const [skuMasters, setSkuMasters] = useState([]);
  const [loadingSku, setLoadingSku] = useState(true);

  useEffect(() => {
    async function fetchSkuMasters() {
      try {
        const data = await apiFetch('/masters/sku');
        setSkuMasters(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('SKU master fetch error:', error);
        setSkuMasters([]);
      } finally {
        setLoadingSku(false);
      }
    }
    fetchSkuMasters();
  }, []);

  if (!poDocument && !invoice) {
    return <div>No data available.</div>;
  }

  if (loadingSku) {
    return (
      <div className="p-4 text-sm text-muted-foreground">Loading SKU master...</div>
    );
  }

  const poItems = poDocument?.items || [];
  const invoiceItems = invoice?.items || [];
  const grnItems = grn?.items || [];

  // PO lookup by itemCode (ERP code)
  const poByCode = {};
  for (const item of poItems) {
    const code = String(item.itemCode || '').trim().toLowerCase();
    if (!code) continue;
    if (!poByCode[code]) poByCode[code] = { totalQty: 0, item };
    poByCode[code].totalQty += Number(item.quantity || 0);
  }

  // GRN lookup by itemCode
  const grnByCode = {};
  for (const item of grnItems) {
    const code = String(item.itemCode || '').trim().toLowerCase();
    if (!code) continue;
    if (!grnByCode[code]) grnByCode[code] = { totalQty: 0 };
    grnByCode[code].totalQty += Number(item.receivedQuantity || 0);
  }

  // SKU lookup by eanCode
  const skuByEan = {};
  for (const sku of skuMasters) {
    const ean = String(sku.eanCode || '').trim().toLowerCase();
    if (ean) skuByEan[ean] = sku;
  }

  // Build invoice items
  const allItems = [];
  for (const invItem of invoiceItems) {
    const invoiceCode = String(invItem.itemCode || '').trim();
    const invoiceCodeLower = invoiceCode.toLowerCase();

    // Invoice item code = eanCode in SKU master → get skuErpCode
    const sku = skuByEan[invoiceCodeLower] || null;
    const erpCode = sku?.skuErpCode || '-';

    // Match PO using ERP code
    let poMatch = null;
    if (erpCode !== '-') {
      poMatch = poByCode[erpCode.toLowerCase()] || null;
    }

    // Match GRN using ERP code
    let grnQty = 0;
    if (erpCode !== '-') {
      grnQty = grnByCode[erpCode.toLowerCase()]?.totalQty || 0;
    }

    allItems.push({
      itemCode: invoiceCode,
      invoiceQty: Number(invItem.quantity || 0),
      rate: Number(invItem.unitRate || 0),
      mrp: Number(invItem.mrp || 0),
      skuName: sku?.name || invItem.description || '-',
      eanCode: sku?.eanCode || invoiceCode,
      erpCode,
      agreedRate: Number(sku?.agreedRate || 0),
      poQty: poMatch ? poMatch.totalQty : 0,
      grnQty,
      skuMatched: !!sku,
      inPO: !!poMatch,
      source: 'invoice',
    });
  }

  function getStatus(item) {
    if (!item.skuMatched) {
      return { label: 'Not found in PO', color: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300' };
    }
    if (item.invoiceQty === item.poQty && item.grnQty === item.invoiceQty) {
      return { label: 'Match', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' };
    }
    return { label: 'Mismatch', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' };
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Fulfillment Items</h3>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Invoice Item Code (EAN)</th>
              <th className="px-4 py-3 text-left">Item Name</th>
              <th className="px-4 py-3 text-left">ERP Code</th>
              <th className="px-4 py-3 text-left">PO Qty</th>
              <th className="px-4 py-3 text-left">Invoice Qty</th>
              <th className="px-4 py-3 text-left">GRN Qty</th>
              <th className="px-4 py-3 text-left">Rate</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {allItems.map((item, idx) => {
              const status = getStatus(item);
              return (
                <tr key={idx} className={`border-t hover:bg-muted/50 transition-colors ${!item.inPO ? 'bg-red-50/50 dark:bg-red-950/50' : ''}`}>
                  <td className="px-4 py-3">{idx + 1}</td>
                  <td className="px-4 py-3">{item.itemCode || '-'}</td>
                  <td className="px-4 py-3">{item.skuName || '-'}</td>
                  <td className="px-4 py-3 font-medium">{item.erpCode || '-'}</td>
                  <td className="px-4 py-3">{item.poQty > 0 ? formatQty(item.poQty) : '-'}</td>
                  <td className="px-4 py-3">{item.invoiceQty > 0 ? formatQty(item.invoiceQty) : '-'}</td>
                  <td className="px-4 py-3">{item.grnQty > 0 ? formatQty(item.grnQty) : '-'}</td>
                  <td className="px-4 py-3">{item.rate > 0 ? formatCurrency(item.rate) : '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
