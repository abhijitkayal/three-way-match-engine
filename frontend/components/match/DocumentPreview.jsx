'use client';

import { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, FileX, Loader2 } from 'lucide-react';
import { fetchFileBlob } from '../../lib/api';

export default function DocumentPreview({ documentId, filePath }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [zoom, setZoom] = useState(100);

  const isPdf = filePath && filePath.toLowerCase().endsWith('.pdf');
  const isImage = filePath && /\.(jpg|jpeg|png|webp|gif)$/i.test(filePath);

  useEffect(() => {
    if (!documentId) return;
    let cancelled = false;
    let currentBlobUrl = null;

    async function load() {
      setLoading(true);
      setError(false);
      try {
        const url = await fetchFileBlob(`/documents/${documentId}/file`);
        if (!cancelled) {
          currentBlobUrl = url;
          setBlobUrl(url);
        }
        
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
      if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl);
    };
  }, [documentId]);

  if (!documentId || !filePath) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border border-dashed rounded-lg">
        <FileX size={40} className="mb-2 opacity-50" />
        <p className="text-sm">Original document unavailable</p>
        <p className="text-xs text-muted-foreground/60 mt-1">No file was uploaded for this document</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Loader2 size={32} className="mb-2 animate-spin" />
        <p className="text-sm">Loading document...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border border-dashed rounded-lg">
        <FileX size={40} className="mb-2 opacity-50" />
        <p className="text-sm">Original document unavailable</p>
        <p className="text-xs text-muted-foreground/60 mt-1">File could not be loaded from server</p>
      </div>
    );
  }

  const zoomIn = () => setZoom((z) => Math.min(z + 20, 200));
  const zoomOut = () => setZoom((z) => Math.max(z - 20, 40));

  return (
    <div>
      <div className="overflow-auto max-h-[600px] bg-muted rounded border" style={{ minHeight: 300 }}>
        {isPdf ? (
          <iframe
            src={blobUrl}
            className="w-full border-0"
            style={{ height: `${zoom * 4}px`, width: '100%' }}
            title="PDF Preview"
          />
        ) : isImage ? (
          <div className="flex items-center justify-center p-2">
            <img
              src={blobUrl}
              alt="Document preview"
              className="max-w-full h-auto"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center top' }}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <FileX size={40} className="mb-2" />
            <p className="text-sm">Preview not available for this file type</p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-center gap-3 mt-3">
        <button
          onClick={zoomOut}
          className="p-1.5 rounded border border-border hover:bg-muted text-muted-foreground transition-colors"
          title="Zoom out"
        >
          <ZoomOut size={16} />
        </button>
        <span className="text-xs text-muted-foreground font-medium w-12 text-center">{zoom}%</span>
        <button
          onClick={zoomIn}
          className="p-1.5 rounded border border-border hover:bg-muted text-muted-foreground transition-colors"
          title="Zoom in"
        >
          <ZoomIn size={16} />
        </button>
      </div>
    </div>
  );
}
