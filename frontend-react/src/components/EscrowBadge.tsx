import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const EscrowBadge: React.FC<{ holdDurationHours?: number }> = ({ holdDurationHours = 12 }) => {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-semibold shadow-sm backdrop-blur-sm">
      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
      <span>100% Escrow Protected (Funds locked until {holdDurationHours}h post-event)</span>
    </div>
  );
};
