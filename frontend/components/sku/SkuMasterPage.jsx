'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2, X, Loader2, AlertCircle, Package } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { formatCurrency } from '../../lib/constants';

const EMPTY_SKU = {
  skuErpCode: '',
  name: '',
  eanCode: '',
  hsnCode: '',
  uom: '',
  agreedRate: '',
  mrp: '',
  priceTolerance: '0.05',
};

export default function SkuMasterPage() {
  const [skus, setSkus] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_SKU);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    loadSkus();
  }, []);

  async function loadSkus() {
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      console.log(query);
      const data = await apiFetch(`/masters/sku${query}`);
      setSkus(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => loadSkus(), 300);
    return () => clearTimeout(timer);
  }, [search]);

  function openCreate() {
    setForm(EMPTY_SKU);
    setEditingId(null);
    setShowForm(true);
    setError('');
  }

  function openEdit(sku) {
    setForm({
      skuErpCode: sku.skuErpCode,
      name: sku.name,
      eanCode: sku.eanCode || '',
      hsnCode: sku.hsnCode || '',
      uom: sku.uom || '',
      agreedRate: String(sku.agreedRate || ''),
      mrp: String(sku.mrp || ''),
      priceTolerance: String(sku.priceTolerance || '0.05'),
    });
    setEditingId(sku._id);
    setShowForm(true);
    setError('');
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_SKU);
    setError('');
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const body = {
      ...form,
      eanCode: form.eanCode || null,
      agreedRate: Number(form.agreedRate) || 0,
      mrp: Number(form.mrp) || 0,
      priceTolerance: Number(form.priceTolerance) || 0.05,
    };

    try {
      if (editingId) {
        await apiFetch(`/masters/sku/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch('/masters/sku', {
          method: 'POST',
          body: JSON.stringify(body),
        });
      }
      closeForm();
      loadSkus();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this SKU? This action cannot be undone.')) return;
    try {
      await apiFetch(`/masters/sku/${id}`, { method: 'DELETE' });
      loadSkus();
    } catch (err) {
      alert(err.message);
    }
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">SKU Master</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage SKU definitions and pricing</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 dark:hover:bg-primary-500 transition-colors"
        >
          <Plus size={16} />
          Add SKU
        </button>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by ERP code, name, EAN, HSN..."
          className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-background"
        />
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-base font-semibold">
                {editingId ? 'Edit SKU' : 'Create SKU'}
              </h3>
              <button onClick={closeForm} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">ERP Code *</label>
                  <input
                    value={form.skuErpCode}
                    onChange={(e) => handleChange('skuErpCode', e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-background"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-background"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">EAN Code</label>
                  <input
                    value={form.eanCode}
                    onChange={(e) => handleChange('eanCode', e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-background"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">HSN Code</label>
                  <input
                    value={form.hsnCode}
                    onChange={(e) => handleChange('hsnCode', e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-background"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">UOM</label>
                  <input
                    value={form.uom}
                    onChange={(e) => handleChange('uom', e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-background"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Agreed Rate</label>
                  <input
                    type="number"
                    step="0.001"
                    value={form.agreedRate}
                    onChange={(e) => handleChange('agreedRate', e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-background"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">MRP</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.mrp}
                    onChange={(e) => handleChange('mrp', e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-background"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Price Tolerance</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.priceTolerance}
                    onChange={(e) => handleChange('priceTolerance', e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-background"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400 p-3 rounded-lg">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-500 disabled:opacity-50 inline-flex items-center gap-2 transition-colors"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {editingId ? 'Save Changes' : 'Create SKU'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 size={20} className="animate-spin mr-2" />
          Loading SKUs...
        </div>
      ) : (
        <div className="bg-card rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground border-b">ERP Code</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground border-b">Name</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground border-b">EAN</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground border-b">HSN</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground border-b">UOM</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground border-b">Agreed Rate</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground border-b">MRP</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground border-b">Tolerance</th>
                  <th className="text-center px-4 py-2.5 font-medium text-muted-foreground border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {skus.map((sku) => (
                  <tr key={sku._id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-2.5 border-b font-mono text-xs">{sku.skuErpCode}</td>
                    <td className="px-4 py-2.5 border-b font-medium">{sku.name}</td>
                    <td className="px-4 py-2.5 border-b text-muted-foreground">{sku.eanCode || '-'}</td>
                    <td className="px-4 py-2.5 border-b text-muted-foreground">{sku.hsnCode}</td>
                    <td className="px-4 py-2.5 border-b text-muted-foreground">{sku.uom}</td>
                    <td className="px-4 py-2.5 border-b text-right">{formatCurrency(sku.agreedRate)}</td>
                    <td className="px-4 py-2.5 border-b text-right">{formatCurrency(sku.mrp)}</td>
                    <td className="px-4 py-2.5 border-b text-right">{((sku.priceTolerance || 0) * 100).toFixed(0)}%</td>
                    <td className="px-4 py-2.5 border-b text-center">
                      <div className="inline-flex gap-1">
                        <button
                          onClick={() => openEdit(sku)}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(sku._id)}
                          className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950 text-muted-foreground hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {skus.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                      <Package size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No SKUs found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
