import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { EventDetail, TicketTier } from '../types';
import { EscrowBadge } from '../components/EscrowBadge';
import {
  MapPin, Calendar, Clock, ShieldCheck, CheckCircle2,
  AlertCircle, Lock, ExternalLink
} from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [selectedTier, setSelectedTier] = useState<TicketTier | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successTicketId, setSuccessTicketId] = useState<number | null>(null);

  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    api.getEventById(id)
      .then(res => {
        if (res.success && res.data) {
          setEvent(res.data);
          if (res.data.ticketTiers && res.data.ticketTiers.length > 0) {
            setSelectedTier(res.data.ticketTiers[0]);
          }
        } else {
          setError('Event not found');
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!event || !selectedTier) return;
    if (selectedTier.availableSeats <= 0) {
      setError('This tier is completely sold out.');
      return;
    }

    setBookingLoading(true);
    setError(null);

    const idempotencyKey = crypto.randomUUID();

    try {
      // 1. Atomically lock seat in DB and initiate order
      const initRes = await api.initiateCheckout(event.id, selectedTier.id, idempotencyKey);
      if (!initRes.success || !initRes.data) {
        throw new Error(initRes.message || 'Failed to reserve seat. Tier may have sold out.');
      }

      const orderData = initRes.data;

      // 2. Open Razorpay Checkout or Seamless Simulation Fallback
      if (typeof window.Razorpay !== 'undefined') {
        const options = {
          key: orderData.keyId,
          amount: Math.round(Number(orderData.amount) * 100),
          currency: orderData.currency || 'INR',
          name: 'Veritix Escrow Settlement',
          description: `Pass for ${event.title}`,
          order_id: orderData.razorpayOrderId,
          handler: async (response: any) => {
            try {
              const verifyRes = await api.verifyPayment(
                response.razorpay_order_id,
                response.razorpay_payment_id,
                response.razorpay_signature,
                idempotencyKey
              );
              if (verifyRes.success && verifyRes.data) {
                setSuccessTicketId(verifyRes.data.id);
              } else {
                setError(verifyRes.message || 'Payment verification failed');
              }
            } catch (vErr: any) {
              setError(vErr.message);
            } finally {
              setBookingLoading(false);
            }
          },
          prefill: {
            name: user?.fullName || '',
            email: user?.email || '',
            contact: user?.phone || ''
          },
          theme: {
            color: '#4A0E1C'
          },
          modal: {
            ondismiss: () => setBookingLoading(false)
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (resp: any) => {
          setError(resp.error?.description || 'Payment failed');
          setBookingLoading(false);
        });
        rzp.open();
      } else {
        // Simulation mode verification for local bare-metal execution
        const simPaymentId = `pay_sim_${crypto.randomUUID().slice(0, 10)}`;
        const simSig = `sig_sim_${crypto.randomUUID().slice(0, 10)}`;
        const verifyRes = await api.verifyPayment(
          orderData.razorpayOrderId,
          simPaymentId,
          simSig,
          idempotencyKey
        );
        if (verifyRes.success && verifyRes.data) {
          setSuccessTicketId(verifyRes.data.id);
        } else {
          setError(verifyRes.message || 'Simulation payment verification failed');
        }
        setBookingLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during booking');
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Error Loading Event</h2>
        <p className="text-sm text-slate-400 mb-6">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-burgundy-700 text-gold-300 rounded-lg text-sm font-semibold"
        >
          Return to Events
        </button>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Banner / Escrow Guarantee */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-burgundy-900/60 to-[#131A26] border border-gold-500/30">
        <div className="flex items-center gap-3">
          <EscrowBadge holdDurationHours={12} />
          <span className="text-xs text-slate-300 hidden sm:inline">
            Held in escrow pool until 12 hours post-event. Zero risk of phantom venues.
          </span>
        </div>
        <div className="text-xs font-mono text-gold-400">
          Status: <strong className="text-white">{event.status}</strong>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left 2 Cols: Event Info & Markdown */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h1 className="font-editorial text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              {event.title}
            </h1>
            <p className="text-sm text-gold-400 font-mono mt-2">
              Organized by: <strong className="text-white">{event.hostBusinessName || event.hostName}</strong>
            </p>
          </div>

          {/* Venue & Time Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="editorial-card p-4 space-y-2">
              <div className="flex items-center gap-2 text-gold-400 text-xs font-mono font-semibold">
                <MapPin className="w-4 h-4" />
                <span>VENUE GEOLOCATION</span>
              </div>
              <p className="text-sm font-bold text-white">{event.venueName}</p>
              <p className="text-xs text-slate-400 leading-relaxed">{event.venueAddress}</p>
              <div className="pt-2 text-[11px] font-mono text-slate-500">
                Coords: {Number(event.venueLatitude).toFixed(5)}, {Number(event.venueLongitude).toFixed(5)}
              </div>
            </div>

            <div className="editorial-card p-4 space-y-2">
              <div className="flex items-center gap-2 text-gold-400 text-xs font-mono font-semibold">
                <Calendar className="w-4 h-4" />
                <span>SCHEDULE & ESCROW DATES</span>
              </div>
              <p className="text-xs text-slate-300">
                <strong className="text-white">Starts:</strong> {new Date(event.startTime).toLocaleString()}
              </p>
              <p className="text-xs text-slate-300">
                <strong className="text-white">Ends:</strong> {new Date(event.endTime).toLocaleString()}
              </p>
              <p className="text-xs text-emerald-400 pt-1 border-t border-slate-800">
                <strong>Escrow Clearance:</strong> {new Date(event.escrowReleaseTime).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Markdown Content Section */}
          <div className="editorial-card p-6 sm:p-8 space-y-4">
            <h2 className="font-editorial text-2xl font-bold text-white border-b border-[#222E40] pb-3">
              Event Schedule &amp; Details
            </h2>
            <div className="prose prose-invert prose-gold max-w-none text-slate-300 leading-relaxed">
              <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                {event.descriptionMarkdown}
              </ReactMarkdown>
            </div>
          </div>

          {/* Venue Verification Proof Link */}
          <div className="editorial-card p-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Host submitted verified venue booking permissions on record.</span>
            </div>
            <a
              href={event.venueBookingProofUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-gold-400 hover:underline font-mono"
            >
              View Document <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Right 1 Col: Ticket Tier Selection & Atomic Checkout */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 editorial-card p-6 space-y-6">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-gold-400 block mb-1">
                Zero-Overselling Pass Selection
              </span>
              <h3 className="font-editorial text-2xl font-bold text-white">Select Access Tier</h3>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Modal Notification */}
            {successTicketId && (
              <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
                  <CheckCircle2 className="w-5 h-5" />
                  Ticket Issued & Escrow-Protected!
                </div>
                <p>Your cryptographically signed QR ticket is ready in your wallet.</p>
                <button
                  onClick={() => navigate('/wallet')}
                  className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-white font-semibold shadow"
                >
                  Open Ticket Wallet
                </button>
              </div>
            )}

            {/* Tiers List */}
            <div className="space-y-3">
              {event.ticketTiers.map(tier => {
                const isSoldOut = tier.availableSeats <= 0;
                const isSelected = selectedTier?.id === tier.id;

                return (
                  <button
                    key={tier.id}
                    type="button"
                    disabled={isSoldOut}
                    onClick={() => setSelectedTier(tier)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-burgundy-900/60 border-gold-500 shadow-md ring-1 ring-gold-500/40'
                        : isSoldOut
                        ? 'bg-[#0B0F17]/50 border-slate-800 opacity-50 cursor-not-allowed'
                        : 'bg-[#0B0F17] border-[#222E40] hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-white text-sm">{tier.name}</span>
                      <span className="font-mono font-extrabold text-gold-300 text-base">
                        ₹{Number(tier.price).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
                      <span>Total: {tier.totalCapacity}</span>
                      <span className={isSoldOut ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                        {isSoldOut ? 'SOLD OUT' : `${tier.availableSeats} remaining`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Order Summary */}
            {selectedTier && (
              <div className="p-3.5 rounded-xl bg-[#0B0F17] border border-[#222E40] space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Selected Tier</span>
                  <span className="font-semibold text-white">{selectedTier.name}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Pessimistic DB Reservation</span>
                  <span className="text-emerald-400 font-mono">Row-Locked</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Escrow Protection Hold</span>
                  <span className="text-gold-400 font-mono">12h Post-Event</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm text-white">
                  <span>Total Amount</span>
                  <span className="font-mono text-gold-300">₹{Number(selectedTier.price).toLocaleString()}</span>
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={bookingLoading || !selectedTier || selectedTier.availableSeats <= 0}
              onClick={handleCheckout}
              className="w-full py-3 rounded-xl bg-burgundy-700 hover:bg-burgundy-600 border border-gold-500/50 text-gold-200 text-sm font-bold shadow-xl transition-all disabled:opacity-50"
            >
              {bookingLoading ? (
                <span className="inline-flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-gold-300 border-t-transparent rounded-full animate-spin" />
                  Securing Escrow Lock...
                </span>
              ) : selectedTier?.availableSeats && selectedTier.availableSeats <= 0 ? (
                'Sold Out'
              ) : (
                'Reserve & Pay with Escrow Protection'
              )}
            </button>

            <p className="text-[11px] text-slate-500 text-center font-mono leading-relaxed">
              * Payment is routed through Razorpay Linked Account Route with an irrevocable 12-hour hold.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
