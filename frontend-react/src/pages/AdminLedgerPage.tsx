import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { LedgerEntry } from '../types';
import { BookOpen, RefreshCw, CheckCircle2 } from 'lucide-react';

export const AdminLedgerPage: React.FC = () => {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLedger = () => {
    setLoading(true);
    api.getLedger()
      .then(res => {
        if (res.success && res.data) {
          setEntries(res.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#222E40] pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/40 text-gold-300 text-xs font-semibold mb-2">
            <BookOpen className="w-4 h-4 text-gold-400" />
            Immutable Financial Audit Trail
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Double-Entry Financial Audit Ledger
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Complete cryptographic audit ledger recording every ticket reservation, fee deduction, escrow hold, settlement release, and refund.
          </p>
        </div>

        <button
          onClick={fetchLedger}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#131A26] border border-[#222E40] text-xs font-mono text-slate-300 hover:text-white"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Ledger
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400 font-mono">Fetching ledger blocks...</p>
        </div>
      ) : (
        <div className="editorial-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0B0F17] border-b border-[#222E40] text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Entry ID &amp; Time</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">From Account</th>
                  <th className="p-3.5">To Account</th>
                  <th className="p-3.5">Amount (INR)</th>
                  <th className="p-3.5">Idempotency Key</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222E40]">
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No financial transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  entries.map(item => (
                    <tr key={item.id} className="hover:bg-[#1A2333]/40">
                      <td className="p-3.5">
                        <span className="font-bold text-white block truncate max-w-[140px]">{item.entryId}</span>
                        <span className="text-[10px] text-slate-500">{new Date(item.createdAt).toLocaleString()}</span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.entryType === 'TICKET_SALE_HELD'
                            ? 'bg-emerald-950 text-emerald-300'
                            : item.entryType === 'PLATFORM_COMMISSION'
                            ? 'bg-gold-500/20 text-gold-300'
                            : item.entryType === 'DISPUTE_FREEZE'
                            ? 'bg-rose-950 text-rose-300'
                            : item.entryType === 'AUTO_REFUND'
                            ? 'bg-blue-950 text-blue-300'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {item.entryType}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-300">{item.accountFrom}</td>
                      <td className="p-3.5 text-slate-300">{item.accountTo}</td>
                      <td className="p-3.5 font-bold text-gold-300 text-sm">
                        ₹{Number(item.amount).toLocaleString()}
                      </td>
                      <td className="p-3.5 text-slate-500 text-[11px] truncate max-w-[160px]">
                        {item.idempotencyKey}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
