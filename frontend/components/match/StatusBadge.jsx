'use client';

import { CheckCircle, AlertTriangle, XCircle, Circle } from 'lucide-react';

const STATUS_CONFIG = {
  matched: {
    label: 'MATCHED',
    icon: CheckCircle,
    bg: 'bg-emerald-50 dark:bg-emerald-950',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  partially_matched: {
    label: 'PARTIALLY MATCHED',
    icon: AlertTriangle,
    bg: 'bg-amber-50 dark:bg-amber-950',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
  mismatch: {
    label: 'MISMATCH',
    icon: XCircle,
    bg: 'bg-red-50 dark:bg-red-950',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
  },
  insufficient_documents: {
    label: 'INSUFFICIENT DOCUMENTS',
    icon: Circle,
    bg: 'bg-zinc-100 dark:bg-zinc-800',
    text: 'text-zinc-600 dark:text-zinc-400',
    border: 'border-zinc-200 dark:border-zinc-700',
  },
};

export default function StatusBadge({ status, size = 'sm' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.insufficient_documents;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-sm px-3 py-1.5 gap-2',
    lg: 'text-sm px-4 py-2 gap-2',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]}`}
    >
      <Icon size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />
      {config.label}
    </span>
  );
}
