'use client';

import { AlertTriangle } from 'lucide-react';
import { formatReason } from '../../lib/constants';

export default function MismatchBanner({ reasons = [] }) {
  if (!reasons || reasons.length === 0) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-amber-500 mt-0.5 shrink-0" size={18} />
        <div>
          <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">
            {reasons.length === 1 ? 'Mismatch Detected' : `${reasons.length} Mismatches Detected`}
          </h4>
          <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-0.5">
            {reasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-amber-400 mt-0.5">•</span>
                {formatReason(reason)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
