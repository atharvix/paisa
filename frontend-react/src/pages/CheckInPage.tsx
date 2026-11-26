import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Ticket } from '../types';
import { MapPin, CheckCircle2, AlertCircle, Crosshair, ArrowLeft } from 'lucide-react';

export const CheckInPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [geoLoading, setGeoLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lon: number; accuracy: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (!ticketId) return;
    api.getTicketById(Number(ticketId))
      .then(res => {
        if (res.success && res.data) {
          setTicket(res.data);
        } else {
          setError('Ticket not found');
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [ticketId]);

  const acquireLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setGeoLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setLocation({ lat: latitude, lon: longitude, accuracy });

        if (ticket) {
          // Haversine calculation on client for instant UI feedback
          const R = 6371000;
          const lat1 = (latitude * Math.PI) / 180;
          const lat2 = (Number(ticket.venueLatitude) * Math.PI) / 180;
          const dLat = ((Number(ticket.venueLatitude) - latitude) * Math.PI) / 180;
          const dLon = ((Number(ticket.venueLongitude) - longitude) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          setDistance(R * c);
        }

        setGeoLoading(false);
      },
      (err) => {
        setError(`GPS Error: ${err.message}. Please enable location permissions.`);
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleCheckIn = async () => {
    if (!ticket || !location) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.geoCheckIn(
        ticket.id,
        location.lat,
        location.lon,
        location.accuracy
      );

      if (res.success) {
        setSuccessMsg(res.message);
        setTicket(prev => prev ? { ...prev, status: 'CHECKED_IN' } : null);
      } else {
        setError(res.detail || res.message || 'Check-in rejected by fraud engine.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit check-in to geo service');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <button
        onClick={() => navigate('/wallet')}
        className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" /> Return to Wallet
      </button>

      <div className="editorial-card p-6 sm:p-8 space-y-6">
        <div>
          <span className="text-[11px] font-mono text-gold-400 uppercase tracking-wider block mb-1">
            Physical Presence Verification
          </span>
          <h1 className="font-editorial text-3xl font-bold text-white">
            Venue GPS Check-In
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Pass #{ticket.ticketNumber} • {ticket.eventTitle}
          </p>
        </div>

        {/* Venue Information */}
        <div className="bg-[#0B0F17] p-4 rounded-xl border border-[#222E40] space-y-2 text-xs">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white text-sm">{ticket.venueName}</p>
              <p className="text-slate-400">{ticket.venueAddress}</p>
              <p className="font-mono text-[11px] text-slate-500 mt-1">
                Designated Coordinates: {Number(ticket.venueLatitude).toFixed(6)}, {Number(ticket.venueLongitude).toFixed(6)}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
              <CheckCircle2 className="w-5 h-5" />
              Verified & Checked In!
            </div>
            <p>{successMsg}</p>
          </div>
        )}

        {/* GPS Acquire Section */}
        <div className="space-y-4">
          <button
            type="button"
            disabled={geoLoading || submitting || ticket.status === 'CHECKED_IN'}
            onClick={acquireLocation}
            className="w-full py-3 rounded-xl bg-[#1D2738] hover:bg-[#253247] border border-[#2E3E58] text-gold-300 text-xs font-bold font-mono flex items-center justify-center gap-2 shadow"
          >
            <Crosshair className={`w-4 h-4 ${geoLoading ? 'animate-spin' : ''}`} />
            {geoLoading ? 'Reading High-Accuracy GPS Sensor...' : location ? 'Re-Acquire Device Coordinates' : 'Acquire Current GPS Location'}
          </button>

          {location && (
            <div className="bg-[#0B0F17] p-4 rounded-xl border border-[#222E40] space-y-3 font-mono text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Device Latitude:</span>
                <span className="text-white font-bold">{location.lat.toFixed(6)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Device Longitude:</span>
                <span className="text-white font-bold">{location.lon.toFixed(6)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>GPS Error Margin (Accuracy):</span>
                <span className={location.accuracy <= 150 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  ±{location.accuracy.toFixed(1)} meters {location.accuracy > 150 && '(Ceiling: 150m)'}
                </span>
              </div>
              {distance !== null && (
                <div className="pt-2 border-t border-slate-800 flex justify-between font-bold">
                  <span className="text-slate-300">Distance to Venue:</span>
                  <span className={distance <= 300 ? 'text-emerald-400 text-sm' : 'text-rose-400 text-sm'}>
                    {distance.toFixed(1)} meters {distance <= 300 ? '(Within 300m Geofence)' : '(Outside 300m Radius)'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {ticket.status === 'CHECKED_IN' ? (
          <div className="p-3 text-center rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold font-mono">
            TICKET ALREADY MARKED CHECKED IN
          </div>
        ) : (
          <button
            type="button"
            disabled={submitting || !location || (distance !== null && distance > 300) || (location && location.accuracy > 150)}
            onClick={handleCheckIn}
            className="w-full py-3.5 rounded-xl bg-burgundy-700 hover:bg-burgundy-600 border border-gold-500/50 text-gold-200 text-sm font-bold shadow-xl transition-all disabled:opacity-40"
          >
            {submitting ? 'Verifying with Fraud Engine...' : 'Confirm In-Person Check-In'}
          </button>
        )}
      </div>
    </div>
  );
};
