import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { EventDetail } from '../types';
import { EscrowBadge } from '../components/EscrowBadge';
import { MapPin, Calendar, ArrowRight, ShieldCheck, Lock, Users, Sparkles } from 'lucide-react';

export const HomePage: React.FC = () => {
  const [events, setEvents] = useState<EventDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getLiveEvents()
      .then(res => {
        if (res.success && res.data) {
          setEvents(res.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-16 pb-20">
      {/* Editorial Hero */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-[#222E40]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-burgundy-900/40 via-[#0B0F17] to-[#0B0F17] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/40 text-gold-300 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
            Enterprise Anti-Scam Architecture
          </div>

          <h1 className="font-editorial text-4xl sm:text-6xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-tight">
            The Trust-Engine for <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-400 to-amber-200">Live Events</span>
          </h1>

          <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Eliminating fake events, phantom venues, and ticket scalping with mathematical certainty.
            Ticket proceeds remain held in an escrow pool until 12 hours after physical venue verification.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/wallet"
              className="px-6 py-3 rounded-xl bg-burgundy-700 hover:bg-burgundy-600 border border-gold-500/40 text-gold-200 font-semibold shadow-xl transition-all"
            >
              My Ticket Wallet
            </Link>
            <Link
              to="/host/events"
              className="px-6 py-3 rounded-xl bg-[#131A26] hover:bg-[#1A2333] border border-[#222E40] text-slate-200 font-semibold transition-all"
            >
              Organizer Escrow Studio
            </Link>
          </div>

          {/* Three Security Pillars */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-5xl mx-auto">
            <div className="editorial-card p-6">
              <div className="w-10 h-10 rounded-lg bg-burgundy-900/60 border border-gold-500/30 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5 text-gold-400" />
              </div>
              <h3 className="font-editorial text-lg font-bold text-white mb-2">12-Hour Escrow Hold</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Host payouts remain locked until 12 hours post-event. If a venue is empty or fake, funds never leave the escrow vault.
              </p>
            </div>

            <div className="editorial-card p-6">
              <div className="w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center mb-4">
                <MapPin className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="font-editorial text-lg font-bold text-white mb-2">GPS & EXIF Venue Proof</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Attendees check in within 300m of venue coordinates. Anti-scam reports capture camera EXIF timestamps to stop fraud instantly.
              </p>
            </div>

            <div className="editorial-card p-6">
              <div className="w-10 h-10 rounded-lg bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center mb-4">
                <Users className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="font-editorial text-lg font-bold text-white mb-2">Crowd Dispute Freezing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automated consensus algorithm: if 25% of verified ticket holders flag an empty venue, payouts are instantly frozen for refunds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Verified Events */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="font-editorial text-3xl font-bold text-white">Verified Live Events</h2>
            <p className="text-sm text-slate-400 mt-1">
              All events verified with venue permission deeds and protected under the escrow settlement guarantee.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-slate-400 font-mono">Loading verified listings...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="editorial-card p-12 text-center">
            <ShieldCheck className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-1">No Active Public Events</h3>
            <p className="text-sm text-slate-400">Be the first verified organizer to publish an event.</p>
            <Link
              to="/host/events"
              className="mt-4 inline-block px-5 py-2 rounded-lg bg-burgundy-700 text-gold-300 text-sm font-semibold"
            >
              Create Event in Studio
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map(event => (
              <div key={event.id} className="editorial-card overflow-hidden flex flex-col group">
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <EscrowBadge />
                      <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded bg-[#1D2738] text-gold-400 border border-gold-500/20">
                        {event.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 className="font-editorial text-xl font-bold text-white group-hover:text-gold-300 transition-colors line-clamp-2">
                      {event.title}
                    </h3>

                    <div className="mt-4 space-y-2 text-xs text-slate-400">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{event.venueName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{new Date(event.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#222E40] flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-mono">Tiers starting from</span>
                      <span className="text-lg font-bold font-mono text-gold-300">
                        ₹{event.ticketTiers?.[0]?.price ? Number(event.ticketTiers[0].price).toLocaleString() : 'Free'}
                      </span>
                    </div>

                    <Link
                      to={`/events/${event.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1F293D] hover:bg-burgundy-700 text-white hover:text-gold-200 text-xs font-semibold transition-all border border-[#2E3C52] hover:border-gold-500/50"
                    >
                      Book Pass
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
