import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Ticket } from '../types';
import {
  ShieldAlert, Camera, MapPin, AlertCircle,
  CheckCircle2, ArrowLeft, Upload
} from 'lucide-react';

export const ReportVenuePage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [reportText, setReportText] = useState('');
  const [location, setLocation] = useState<{ lat: number; lon: number; accuracy: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
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

    // Automatically trigger GPS lookup
    if (navigator.geolocation) {
      setGeoLoading(true);
      navigator.geolocation.getCurrentPosition(
        pos => {
          setLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          });
          setGeoLoading(false);
        },
        err => {
          console.warn('GPS prompt dismissed:', err.message);
          setGeoLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [ticketId]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !user) return;
    if (!photoFile) {
      setError('Live camera photo is mandatory to prove physical venue condition.');
      return;
    }

    if (!location) {
      setError('GPS coordinates are required to verify you are physically at the venue.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append('event_id', String(ticket.eventId));
    formData.append('reporter_user_id', String(user.id));
    formData.append('ticket_id', String(ticket.id));
    formData.append('latitude', String(location.lat));
    formData.append('longitude', String(location.lon));
    formData.append('accuracy', String(location.accuracy));
    formData.append('report_text', reportText);
    formData.append('photo', photoFile);

    try {
      const res = await api.reportVenue(formData);
      if (res.success) {
        setResult(res);
      } else {
        setError(res.detail || res.message || 'Report rejected by fraud engine');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with fraud engine');
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-semibold mb-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            Anti-Scam Empty / Fake Venue Report
          </div>
          <h1 className="font-editorial text-3xl font-bold text-white">
            Report Fraudulent Venue
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Provide forensic camera evidence. If verified by our EXIF &amp; GPS consensus engine, host payouts will be frozen and full ticket refunds triggered.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result ? (
          <div className="p-6 rounded-xl bg-gradient-to-b from-[#131A26] to-[#0B0F17] border border-gold-500/50 space-y-4">
            <div className="flex items-center gap-2 text-gold-300 font-bold text-lg font-editorial">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              Dispute Evidence Logged on Chain
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {result.message}
            </p>

            <div className="p-4 rounded-lg bg-[#0B0F17] border border-[#222E40] space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">EXIF Camera Status:</span>
                <span className="text-emerald-400 font-bold">{result.exif_status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">EXIF Details:</span>
                <span className="text-slate-200">{result.exif_details}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Distance From Venue:</span>
                <span className="text-white">{result.distance_from_venue_meters} meters</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Unique Reporters:</span>
                <span className="text-gold-300 font-bold">{result.current_dispute_count}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800">
                <span className="text-slate-400">Crowd Freeze Triggered:</span>
                <span className={result.automatic_fraud_freeze_triggered ? 'text-rose-400 font-bold animate-pulse' : 'text-slate-400'}>
                  {result.automatic_fraud_freeze_triggered ? 'YES - PAYOUTS LOCKED INDEFINITELY' : 'PENDING CONSENSUS RATIO'}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate('/wallet')}
              className="w-full py-2.5 rounded-lg bg-burgundy-700 hover:bg-burgundy-600 text-gold-200 text-xs font-semibold"
            >
              Back to Wallet
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Camera File Upload with capture="environment" */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-mono">
                1. Capture Live Camera Photo of Venue (EXIF Verified)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-[#222E40] hover:border-gold-500/50 border-dashed rounded-xl bg-[#0B0F17]">
                <div className="space-y-2 text-center">
                  {photoPreview ? (
                    <div className="space-y-2">
                      <img src={photoPreview} alt="Preview" className="max-h-48 rounded-lg mx-auto shadow" />
                      <p className="text-[11px] text-emerald-400 font-mono">Photo loaded with camera metadata</p>
                    </div>
                  ) : (
                    <>
                      <Camera className="mx-auto h-10 w-10 text-slate-400" />
                      <div className="flex text-xs text-slate-400 justify-center">
                        <label
                          htmlFor="camera-input"
                          className="relative cursor-pointer rounded-md font-semibold text-gold-400 hover:text-gold-300 focus-within:outline-none"
                        >
                          <span>Take Live Photo or Upload</span>
                          <input
                            id="camera-input"
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handlePhotoChange}
                            className="sr-only"
                          />
                        </label>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">
                        * Camera EXIF timestamp &amp; model will be parsed by Pillow. Screenshots will be flagged.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* GPS Sensor Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-mono">
                2. Physical Location GPS Coordinates
              </label>
              <div className="p-3 bg-[#0B0F17] rounded-lg border border-[#222E40] text-xs font-mono space-y-1">
                {geoLoading ? (
                  <span className="text-slate-400 animate-pulse">Reading device GPS sensor...</span>
                ) : location ? (
                  <div className="flex justify-between items-center text-emerald-400">
                    <span>GPS Acquired: {location.lat.toFixed(5)}, {location.lon.toFixed(5)}</span>
                    <span>Acc: ±{location.accuracy.toFixed(0)}m</span>
                  </div>
                ) : (
                  <span className="text-rose-400">GPS not acquired. Please grant browser location permission.</span>
                )}
              </div>
            </div>

            {/* Description Text */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-mono">
                3. Describe What You See At The Venue
              </label>
              <textarea
                required
                rows={3}
                value={reportText}
                onChange={e => setReportText(e.target.value)}
                placeholder="e.g. Venue doors are completely shuttered and dark. Security says no event was ever scheduled here."
                className="w-full bg-[#0B0F17] border border-[#222E40] rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !photoFile || !location}
              className="w-full py-3 rounded-xl bg-rose-900/80 hover:bg-rose-800 border border-rose-500/50 text-rose-100 text-sm font-bold shadow-xl transition-all disabled:opacity-40"
            >
              {submitting ? 'Verifying Forensic EXIF & Distance...' : 'Submit Fraud Evidence to Escrow Vault'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
