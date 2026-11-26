import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { EventDetail, EscrowBreakdown } from '../types';
import { CountdownTimer } from '../components/CountdownTimer';
import {
  Calendar, Plus, ShieldCheck, AlertCircle,
  XCircle, CheckCircle2, DollarSign, RefreshCw
} from 'lucide-react';

export const HostDashboard: React.FC = () => {
  const [events, setEvents] = useState<EventDetail[]>([]);
  const [selectedBreakdown, setSelectedBreakdown] = useState<EscrowBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchEvents = () => {
    setLoading(true);
    api.getMyHostEvents()
      .then(res => {
        if (res.success && res.data) {
          setEvents(res.data);
          if (res.data.length > 0) {
            loadBreakdown(res.data[0].id);
          }
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  const loadBreakdown = async (eventId: number) => {
    try {
      const res = await api.getEscrowBreakdown(eventId);
      if (res.success && res.data) {
        setSelectedBreakdown(res.data);
      }
    } catch (e: any) {
      console.error('Breakdown fetch error:', e);
    }
  };

  const handleCancelEvent = async (eventId: number) => {
    if (!window.confirm('Are you sure you want to cancel this event? This will permanently cancel ticket sales and trigger automatic full refunds to all attendees from the escrow pool.')) {
      return;
    }

    setCancelLoading(true);
    setError(null);
    try {
      const res = await api.cancelEvent(eventId);
      if (res.success) {
        setSuccessMsg('Event canceled. Instant attendee refund pipeline triggered.');
        fetchEvents();
      } else {
        setError(res.message || 'Failed to cancel event');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCancelLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#222E40] pb-6">
        <div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Organizer Escrow Studio
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your verified event listings, track ticket sales, and monitor escrow settlement hold schedules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/host/create-event"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-burgundy-700 hover:bg-burgundy-600 text-gold-200 text-xs font-semibold shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Create New Event
          </Link>
          <button
            onClick={fetchEvents}
            className="p-2 rounded-lg bg-[#131A26] border border-[#222E40] text-slate-400 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400 font-mono">Loading studio data...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="editorial-card p-12 text-center max-w-lg mx-auto">
          <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">No Events Published Yet</h3>
          <p className="text-sm text-slate-400 mb-6">
            Ensure your Host KYC is verified, then launch your first anti-scam escrow event.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              to="/host/kyc"
              className="px-4 py-2 bg-[#131A26] border border-[#222E40] text-slate-200 rounded-lg text-xs font-semibold"
            >
              Check KYC Status
            </Link>
            <Link
              to="/host/create-event"
              className="px-4 py-2 bg-burgundy-700 text-gold-200 rounded-lg text-xs font-semibold"
            >
              Create Listing
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Events Table / Cards */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-editorial text-xl font-bold text-white mb-2">My Event Listings</h2>
            {events.map(event => (
              <div
                key={event.id}
                onClick={() => loadBreakdown(event.id)}
                className={`editorial-card p-5 cursor-pointer transition-all ${
                  selectedBreakdown?.eventId === event.id
                    ? 'border-gold-500 ring-1 ring-gold-500/40'
                    : 'hover:border-slate-700'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded ${
                    event.status === 'VERIFIED_LIVE'
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                      : event.status === 'FROZEN_DISPUTE'
                      ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                      : event.status === 'CANCELED'
                      ? 'bg-slate-800 text-slate-400 border border-slate-700'
                      : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                  }`}>
                    {event.status.replace(/_/g, ' ')}
                  </span>

                  <span className="text-xs font-mono text-slate-400">
                    ID: #{event.id}
                  </span>
                </div>

                <h3 className="font-editorial text-lg font-bold text-white mb-1">
                  {event.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-1 mb-4">
                  {event.venueName} • {new Date(event.startTime).toLocaleDateString()}
                </p>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 bg-[#0B0F17] p-3 rounded-lg border border-[#222E40] text-center font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Tickets Sold</span>
                    <span className="text-sm font-bold text-white">{event.totalTicketsSold}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Checked In</span>
                    <span className="text-sm font-bold text-emerald-400">{event.checkedInCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Disputes</span>
                    <span className={`text-sm font-bold ${event.disputeCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                      {event.disputeCount}
                    </span>
                  </div>
                </div>

                {/* Self-Service Cancellation Option */}
                {event.status === 'VERIFIED_LIVE' && (
                  <div className="mt-4 pt-3 border-t border-[#222E40] flex justify-end">
                    <button
                      type="button"
                      disabled={cancelLoading}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelEvent(event.id);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 text-xs font-semibold"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Cancel Event &amp; Trigger Instant Bulk Refunds
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right 1 Col: Escrow & Settlement Breakdown Pane */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 editorial-card p-6 space-y-6">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-gold-400 block mb-1">
                  Financial Settlement Breakdown
                </span>
                <h3 className="font-editorial text-xl font-bold text-white">
                  Escrow Payout Vault
                </h3>
              </div>

              {selectedBreakdown ? (
                <div className="space-y-4">
                  {/* Countdown Timer to Release */}
                  <div className="p-4 rounded-xl bg-[#0B0F17] border border-gold-500/30 space-y-2">
                    <span className="text-[11px] font-mono text-slate-400 block uppercase">
                      Countdown to Payout Release (Event + 12h):
                    </span>
                    <CountdownTimer targetIso={selectedBreakdown.onHoldUntil} />
                    <p className="text-[10px] text-slate-500 font-mono">
                      Target: {new Date(selectedBreakdown.onHoldUntil).toLocaleString()}
                    </p>
                  </div>

                  {/* Financial Breakdown Items */}
                  <div className="p-4 rounded-xl bg-[#0B0F17] border border-[#222E40] space-y-2.5 text-xs font-mono">
                    <div className="flex justify-between text-slate-300">
                      <span>Gross Ticket Sales:</span>
                      <span className="font-bold text-white">₹{Number(selectedBreakdown.grossTicketSales).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Gateway Fee (~2%):</span>
                      <span className="text-rose-400">-₹{Number(selectedBreakdown.gatewayFeeAmount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Platform Fee ({selectedBreakdown.platformFeePercent}%):</span>
                      <span className="text-rose-400">-₹{Number(selectedBreakdown.platformFeeAmount).toLocaleString()}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm">
                      <span className="text-gold-300">Net Held Payout:</span>
                      <span className="text-gold-400">₹{Number(selectedBreakdown.netHeldPayout).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[11px] pt-1">
                      <span className="text-slate-500">Vault Status:</span>
                      <span className="text-emerald-400 font-bold">{selectedBreakdown.escrowStatus}</span>
                    </div>
                  </div>

                  {/* Security Confirmation Notice */}
                  <div className="p-3.5 rounded-xl bg-[#16202E] border border-blue-500/30 text-xs text-blue-200 leading-relaxed flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white mb-0.5">Host Balance Protection</p>
                      <p className="text-[11px] text-slate-300">
                        {selectedBreakdown.hostExternalAccountNote}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-8 font-mono">
                  Select an event to view its escrow ledger breakdown.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
