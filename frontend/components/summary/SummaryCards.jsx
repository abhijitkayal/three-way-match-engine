'use client';

import { TrendingUp, Receipt, Package } from 'lucide-react';
import { formatCurrency, formatQty } from '../../lib/constants';

export default function SummaryCards({ summary }) {
  if (!summary) return null;

  const cards = [
    {
      label: 'PO Amount',
      value: formatCurrency(summary.poAmount),
      icon: Receipt,
      color: 'text-primary-600 dark:text-primary-400',
      iconBg: 'bg-primary-100 dark:bg-primary-900',
    },
    {
      label: 'Total Invoiced',
      value: formatCurrency(summary.totalInvoiced),
      icon: TrendingUp,
      color: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-100 dark:bg-amber-900',
    },
    {
      label: 'Total Received',
      value: formatQty(summary.cumulativeReceivedQty),
      icon: Package,
      color: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-card rounded-lg border p-5 flex items-center gap-4"
          >
            <div className={`p-3 rounded-lg ${card.iconBg}`}>
              <Icon size={22} className={card.color} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{card.label}</p>
              <p className="text-xl font-bold mt-0.5">{card.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
