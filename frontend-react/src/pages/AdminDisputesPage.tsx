import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { VenueDispute } from '../types';
import {
  ShieldAlert, Lock, CheckCircle2, AlertCircle,
  ExternalLink, MapPin, Camera, RefreshCw
} from 'lucide-react';

export const AdminDisputesPage: React.FC = () => {
  const [disputes, setDisputes] = useState<VenueDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchDisputes = () => {
    setLoading(true);
    api.getDisputes()
      .then(res => {
        if (res.success && res.data) {
          setDisputes(res.data);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleAction = async (eventId: number, action: string) => {
    setActionLoading(eventId);
    setError(null);
    try {
      const res = await api.disputeAction(
        eventId,
        action,
        `Admin action performed on dispute console`
      );
      if (res.success) {
        setMessage(res.message);
        fetchDisputes();
      } else {
        setError(res.message || 'Action failed');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#222E40] pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-semibold mb-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            Fraud &amp; Dispute Control Center
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Empty Venue Dispute Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review crowd-sourced fraud reports with Pillow-parsed EXIF camera verification and live device GPS telemetry.
          </p>
        </div>

        <button
          onClick={fetchDisputes}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#131A26] border border-[#222E40] text-xs font-mono text-slate-300 hover:text-white"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Disputes
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
          <p className="text-sm text-slate-400 font-mono">Loading dispute reports...</p>
        </div>
      ) : disputes.length === 0 ? (
        <div className="editorial-card p-12 text-center max-w-lg mx-auto font-mono text-slate-400 text-sm">
          No open venue disputes recorded on platform.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {disputes.map(d => (
            <div key={d.id} className="editorial-card p-6 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded ${
                    d.exifValidationStatus === 'VERIFIED_VALID'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                  }`}>
                    EXIF: {d.exifValidationStatus}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Dispute #{d.id} • Event #{d.eventId}
                  </span>
                </div>

                <p className="text-xs font-mono text-slate-300 bg-[#0B0F17] p-3 rounded-lg border border-[#222E40] italic">
                  "{d.reportText}"
                </p>

                {/* Evidence Metrics */}
                <div className="grid grid-cols-2 gap-2 mt-3 font-mono text-xs">
                  <div className="bg-[#0B0F17] p-2.5 rounded border border-[#222E40]">
                    <span className="text-[10px] text-slate-500 block uppercase">Reporter Distance</span>
                    <span className="text-gold-300 font-bold">{d.distanceFromVenueMeters} meters</span>
                  </div>
                  <div className="bg-[#0B0F17] p-2.5 rounded border border-[#222E40]">
                    <span className="text-[10px] text-slate-500 block uppercase">Camera Hardware</span>
                    <span className="text-white truncate block">{d.exifCameraMake || 'N/A'} {d.exifCameraModel || ''}</span>
                  </div>
                </div>

                {/* Photo Preview Link */}
                <div className="mt-3">
                  <a
                    href={d.photoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-gold-400 hover:underline font-mono"
                  >
                    <Camera className="w-4 h-4" /> View Forensic Camera Shot <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Manual Override Action Buttons */}
              <div className="pt-4 border-t border-[#222E40] grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={actionLoading === d.eventId}
                  onClick={() => handleAction(d.eventId, 'FORCE_FREEZE_AND_REFUND')}
                  className="py-2 px-3 rounded-lg bg-rose-900/80 hover:bg-rose-800 text-rose-100 text-xs font-bold border border-rose-500/40 shadow"
                >
                  <Lock className="w-3.5 h-3.5 inline mr-1" />
                  Force Freeze &amp; Refund
                </button>

                <button
                  type="button"
                  disabled={actionLoading === d.eventId}
                  onClick={() => handleAction(d.eventId, 'DISMISS_DISPUTE_AND_RELEASE')}
                  className="py-2 px-3 rounded-lg bg-[#1F293D] hover:bg-[#2A374F] text-slate-200 text-xs font-semibold border border-[#2E3C52]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 text-emerald-400" />
                  Dismiss &amp; Clear Payout
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
