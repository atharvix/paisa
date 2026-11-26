import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Ticket } from '../types';
import { EscrowBadge } from '../components/EscrowBadge';
import { QrCodeModal } from '../components/QrCodeModal';
import {
  Ticket as TicketIcon, QrCode, MapPin, Calendar,
  ShieldAlert, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';

export const AttendeeDashboard: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);

  const fetchTickets = () => {
    setLoading(true);
    api.getMyTickets()
      .then(res => {
        if (res.success && res.data) {
          setTickets(res.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#222E40] pb-6">
        <div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            My Ticket Wallet
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            All your passes are cryptographically signed and secured by our 12-hour post-event escrow vault.
          </p>
        </div>
        <button
          onClick={fetchTickets}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#131A26] border border-[#222E40] text-xs font-mono text-slate-300 hover:text-white"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Status
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400 font-mono">Fetching wallet assets...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="editorial-card p-12 text-center max-w-lg mx-auto">
          <TicketIcon className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">No Tickets in Wallet</h3>
          <p className="text-sm text-slate-400 mb-6">
            You haven't booked any event passes yet. Browse verified listings to secure tickets.
          </p>
          <Link
            to="/"
            className="px-5 py-2.5 rounded-lg bg-burgundy-700 hover:bg-burgundy-600 text-gold-200 text-sm font-semibold shadow-lg"
          >
            Explore Verified Events
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tickets.map(ticket => (
            <div key={ticket.id} className="editorial-card p-6 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <EscrowBadge />
                  <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded ${
                    ticket.status === 'CHECKED_IN'
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                      : ticket.status === 'DISPUTE_FROZEN'
                      ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                      : ticket.status === 'AUTO_REFUNDED'
                      ? 'bg-blue-950/80 text-blue-300 border border-blue-500/40'
                      : 'bg-[#1D2738] text-gold-300 border border-gold-500/40'
                  }`}>
                    {ticket.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <h3 className="font-editorial text-xl font-bold text-white">
                  {ticket.eventTitle}
                </h3>
                <p className="text-xs font-mono text-gold-400 mt-0.5">
                  {ticket.tierName} • Pass #{ticket.ticketNumber}
                </p>

                {/* Details */}
                <div className="mt-4 space-y-2 text-xs text-slate-300 bg-[#0B0F17] p-3 rounded-lg border border-[#222E40]">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white">{ticket.venueName}</p>
                      <p className="text-slate-400 text-[11px]">{ticket.venueAddress}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800 text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(ticket.startTime).toLocaleString()}</span>
                  </div>
                </div>

                {/* Refund Status Timeline */}
                <div className="mt-4 pt-4 border-t border-[#222E40]">
                  <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2">
                    Escrow &amp; Refund Status Timeline:
                  </p>
                  <div className="grid grid-cols-3 gap-1 text-center font-mono text-[10px]">
                    <div className={`p-1.5 rounded ${ticket.status ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'}`}>
                      1. HELD IN ESCROW
                    </div>
                    <div className={`p-1.5 rounded ${ticket.status === 'DISPUTE_FROZEN' || ticket.status === 'AUTO_REFUNDED' ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30' : 'bg-[#0B0F17] text-slate-600'}`}>
                      2. DISPUTE FROZEN
                    </div>
                    <div className={`p-1.5 rounded ${ticket.status === 'AUTO_REFUNDED' ? 'bg-blue-950/80 text-blue-300 border border-blue-500/30 font-bold' : 'bg-[#0B0F17] text-slate-600'}`}>
                      3. AUTO REFUNDED
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTicket(ticket)}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-burgundy-700 hover:bg-burgundy-600 text-gold-200 text-xs font-semibold shadow"
                >
                  <QrCode className="w-4 h-4" />
                  Show Signed QR
                </button>

                <Link
                  to={`/checkin/${ticket.id}`}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#1F293D] hover:bg-[#27354D] text-white text-xs font-semibold border border-[#2E3C52]"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  GPS Check-In
                </Link>

                <Link
                  to={`/report/${ticket.id}`}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold border border-rose-500/30"
                >
                  <ShieldAlert className="w-4 h-4" />
                  Report Empty
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Modal */}
      {activeTicket && (
        <QrCodeModal ticket={activeTicket} onClose={() => setActiveTicket(null)} />
      )}
    </div>
  );
};
