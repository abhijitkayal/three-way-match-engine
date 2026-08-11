'use client';

import { useState, useRef } from 'react';
import { Upload as UploadIcon, FileText, CheckCircle, AlertCircle, Loader2, X, AlertTriangle } from 'lucide-react';
import { apiFetch } from '../lib/api';

export default function Upload({ onUploaded }) {
  const [documentType, setDocumentType] = useState('po');
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [duplicateInfo, setDuplicateInfo] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }

  function handleFileChange(e) {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;

    setStatus('uploading');
    setError('');
    setDuplicateInfo(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);

      setStatus('parsing');

      const response = await apiFetch('/documents/upload', {
        method: 'POST',
        body: formData,
        headers: {},
      });

      if (response.duplicateInfo) {
        setDuplicateInfo(response.duplicateInfo);
      }

      setStatus('done');
      setFile(null);
      if (onUploaded) onUploaded();
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  function reset() {
    setFile(null);
    setStatus('');
    setError('');
    setDuplicateInfo(null);
  }

  const isProcessing = status === 'uploading' || status === 'parsing';

  const statusMessages = {
    uploading: 'Uploading file...',
    parsing: 'Parsing with AI...',
    done: 'Upload complete!',
  };

  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="flex items-center gap-2 mb-3">
        <UploadIcon size={16} className="text-muted-foreground" />
        <h3 className="text-sm font-semibold">Upload Document</h3>
      </div>

      <form onSubmit={handleUpload}>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            disabled={isProcessing}
            className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-background disabled:opacity-50"
          >
            <option value="po">Purchase Order</option>
            <option value="grn">GRN</option>
            <option value="invoice">Invoice</option>
          </select>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex-1 border-2 border-dashed rounded-lg px-4 py-2.5 text-center cursor-pointer transition-colors ${
              dragActive
                ? 'border-primary-400 bg-primary-50 dark:bg-primary-950'
                : file
                ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950'
                : 'border-border hover:border-zinc-300 dark:hover:border-zinc-600 bg-muted/50'
            } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
              className="hidden"
            />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <FileText size={16} className="text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">{file.name}</span>
                {!isProcessing && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      reset();
                    }}
                    className="p-0.5 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-500"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Drag & drop or <span className="text-primary-600 dark:text-primary-400 font-medium">choose file</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!file || isProcessing}
            className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {isProcessing && <Loader2 size={14} className="animate-spin" />}
            {isProcessing ? 'Processing...' : 'Upload'}
          </button>
        </div>
      </form>

      {status && status !== 'error' && (
        <div className="mt-3 flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950 px-3 py-2 rounded-lg">
          {status === 'done' ? (
            <CheckCircle size={16} className="text-emerald-500" />
          ) : (
            <Loader2 size={16} className="animate-spin" />
          )}
          {statusMessages[status]}
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400 px-3 py-2 rounded-lg">
          <AlertCircle size={16} />
          <div>
            <span className="font-medium">Failed to parse document.</span>{' '}
            <span>{error}</span>
          </div>
        </div>
      )}

      {duplicateInfo && duplicateInfo.isDuplicate && (
        <div className="mt-3 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-100 dark:bg-amber-900">
            <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              Duplicate PO Detected!
            </span>
          </div>
          <div className="px-3 py-2">
            <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">
              This PO number <span className="font-bold">{duplicateInfo.duplicates[0]?.poNumber}</span> already exists.{' '}
              <span className="font-medium">{duplicateInfo.totalCount} POs</span> found with this number.
            </p>
            <div className="text-xs text-amber-600 dark:text-amber-400">
              <p className="font-medium mb-1">Existing POs:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {duplicateInfo.duplicates.map((po, idx) => (
                  <li key={po.id || idx}>
                    {po.poDate ? new Date(po.poDate).toLocaleDateString() : 'No date'} — {po.vendorName || 'Unknown vendor'} — {po.itemCount} items
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
