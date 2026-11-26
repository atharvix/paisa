import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { HostProfile, EventDetail } from '../types';
import {
  ShieldCheck, Check, X, ExternalLink,
  Calendar, UserCheck, AlertCircle, RefreshCw
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [kycQueue, setKycQueue] = useState<HostProfile[]>([]);
  const [eventsQueue, setEventsQueue] = useState<EventDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [kycRes, eventsRes] = await Promise.all([
        api.getKycQueue(),
        api.getAdminEvents()
      ]);
      if (kycRes.success && kycRes.data) setKycQueue(kycRes.data);
      if (eventsRes.success && eventsRes.data) setEventsQueue(eventsRes.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerifyKyc = async (profileId: number, approve: boolean) => {
    setActionLoading(`kyc-${profileId}`);
    try {
      const res = await api.verifyKyc(profileId, approve);
      if (res.success) {
        setMessage(`Host KYC ${approve ? 'Approved' : 'Rejected'}`);
        fetchData();
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerifyEvent = async (eventId: number, approve: boolean) => {
    setActionLoading(`evt-${eventId}`);
    try {
      const res = await api.verifyEvent(eventId, approve);
      if (res.success) {
        setMessage(`Event #${eventId} ${approve ? 'marked VERIFIED_LIVE' : 'drafted'}`);
        fetchData();
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#222E40] pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-semibold mb-2">
            <ShieldCheck className="w-4 h-4 text-rose-400" />
            Compliance &amp; Verification Console
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Admin Verification Queue
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review pending Host KYC submissions and venue booking legal deeds before opening ticket sales.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#131A26] border border-[#222E40] text-xs font-mono text-slate-300 hover:text-white"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Queues
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="p-3.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs">
          {message}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400 font-mono">Loading queues...</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Section 1: Pending Host KYC */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white">
              <UserCheck className="w-5 h-5 text-gold-400" />
              <h2 className="font-editorial text-xl font-bold">
                Pending Host KYC Applications ({kycQueue.length})
              </h2>
            </div>

            {kycQueue.length === 0 ? (
              <div className="editorial-card p-6 text-center text-xs text-slate-400 font-mono">
                No pending KYC applications in queue.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {kycQueue.map(p => (
                  <div key={p.id} className="editorial-card p-5 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-white text-sm">{p.businessName}</h3>
                        <p className="text-xs text-gold-400 font-mono">Entity: {p.businessEntityType}</p>
                      </div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40">
                        {p.kycStatus}
                      </span>
                    </div>

                    <div className="bg-[#0B0F17] p-3 rounded-lg border border-[#222E40] text-xs font-mono space-y-1 text-slate-300">
                      <p>PAN: <strong className="text-white">{p.panNumber}</strong></p>
                      <p>Bank: <strong className="text-white">{p.bankAccountNumber}</strong> (IFSC: {p.bankIfsc})</p>
                      <p>Linked Vendor ID: <strong className="text-gold-300">{p.razorpayAccountId || 'acc_sim_generated'}</strong></p>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <a
                        href={p.kycDocumentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-gold-400 hover:underline font-mono"
                      >
                        Inspect Proof Document <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={actionLoading === `kyc-${p.id}`}
                          onClick={() => handleVerifyKyc(p.id, false)}
                          className="px-3 py-1.5 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-semibold"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading === `kyc-${p.id}`}
                          onClick={() => handleVerifyKyc(p.id, true)}
                          className="px-3 py-1.5 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Event Verification Queue */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white">
              <Calendar className="w-5 h-5 text-gold-400" />
              <h2 className="font-editorial text-xl font-bold">
                Event Verification Queue ({eventsQueue.length})
              </h2>
            </div>

            <div className="editorial-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0B0F17] border-b border-[#222E40] text-slate-400 font-mono uppercase text-[10px]">
                    <tr>
                      <th className="p-3.5">ID</th>
                      <th className="p-3.5">Title &amp; Venue</th>
                      <th className="p-3.5">Host</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Proof URL</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222E40]">
                    {eventsQueue.map(e => (
                      <tr key={e.id} className="hover:bg-[#1A2333]/40">
                        <td className="p-3.5 font-mono text-slate-400">#{e.id}</td>
                        <td className="p-3.5">
                          <p className="font-bold text-white text-sm">{e.title}</p>
                          <p className="text-slate-400 text-[11px]">{e.venueName}</p>
                        </td>
                        <td className="p-3.5 text-slate-300 font-mono">
                          {e.hostBusinessName || e.hostName}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                            e.status === 'VERIFIED_LIVE'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                          }`}>
                            {e.status}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <a
                            href={e.venueBookingProofUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-gold-400 hover:underline font-mono"
                          >
                            Venue Deed <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                        <td className="p-3.5 text-right">
                          {e.status !== 'VERIFIED_LIVE' && (
                            <button
                              type="button"
                              disabled={actionLoading === `evt-${e.id}`}
                              onClick={() => handleVerifyEvent(e.id, true)}
                              className="px-3 py-1.5 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-semibold inline-flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve Live
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
