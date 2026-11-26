import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { api } from '../services/api';
import {
  Calendar, MapPin, Plus, Trash2, ShieldCheck,
  AlertCircle, Eye, Edit3, ArrowLeft
} from 'lucide-react';

interface TierInput {
  name: string;
  price: number;
  totalCapacity: number;
}

const VENUE_PRESETS = [
  { name: 'Nimhans Convention Centre, Bengaluru', lat: 12.9392231, lon: 77.5956742, address: 'Hosur Main Rd, Lakkasandra, Bengaluru, Karnataka 560029' },
  { name: 'Jio World Convention Centre, Mumbai', lat: 19.0645210, lon: 72.8682100, address: 'G Block BKC, Bandra Kurla Complex, Mumbai, Maharashtra 400051' },
  { name: 'Bharat Mandapam (Pragati Maidan), Delhi', lat: 28.6186100, lon: 77.2422300, address: 'Pragati Maidan, New Delhi, Delhi 110001' },
  { name: 'HICC Novotel, Hyderabad', lat: 17.4725100, lon: 78.3728200, address: 'Novotel & HICC Complex, Kondapur, Hyderabad, Telangana 500081' }
];

export const CreateEventPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [descriptionMarkdown, setDescriptionMarkdown] = useState(
    `# Event Overview\n\nWelcome to our flagship event!\n\n### Key Highlights\n- Deep dive into distributed architecture\n- Keynotes by industry leaders\n- Live networking\n\n> *Escrow Security*: All tickets are held in the Veritix platform escrow vault until 12 hours after the event concludes.`
  );
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [venueLatitude, setVenueLatitude] = useState<number>(12.9392231);
  const [venueLongitude, setVenueLongitude] = useState<number>(77.5956742);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [venueBookingProofUrl, setVenueBookingProofUrl] = useState('');
  const [ticketTiers, setTicketTiers] = useState<TierInput[]>([
    { name: 'Early Bird', price: 999, totalCapacity: 200 },
    { name: 'General Admission', price: 1999, totalCapacity: 500 }
  ]);
  const [previewMarkdown, setPreviewMarkdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleApplyPreset = (preset: typeof VENUE_PRESETS[0]) => {
    setVenueName(preset.name);
    setVenueAddress(preset.address);
    setVenueLatitude(preset.lat);
    setVenueLongitude(preset.lon);
  };

  const handleAddTier = () => {
    setTicketTiers(prev => [...prev, { name: 'VIP Pass', price: 4999, totalCapacity: 100 }]);
  };

  const handleRemoveTier = (index: number) => {
    if (ticketTiers.length <= 1) return;
    setTicketTiers(prev => prev.filter((_, i) => i !== index));
  };

  const handleTierChange = (index: number, field: keyof TierInput, val: any) => {
    setTicketTiers(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ticketTiers.length === 0) {
      setError('At least one ticket tier is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.createEvent({
        title,
        descriptionMarkdown,
        venueName,
        venueAddress,
        venueLatitude,
        venueLongitude,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        venueBookingProofUrl,
        ticketTiers
      });

      if (res.success) {
        navigate('/host/events');
      } else {
        setError(res.message || 'Failed to create event');
      }
    } catch (err: any) {
      setError(err.message || 'Error creating event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      <button
        onClick={() => navigate('/host/events')}
        className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" /> Return to Studio
      </button>

      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-burgundy-900/60 border border-gold-500/40 text-gold-300 text-xs font-semibold mb-2">
          <Calendar className="w-4 h-4 text-gold-400" />
          Escrow Event Studio
        </div>
        <h1 className="font-editorial text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Create Escrow-Protected Event
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Set up verified venue coordinates, configure ticket pricing tiers, and compose rich Markdown event descriptions.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Core Event Details */}
        <div className="editorial-card p-6 sm:p-8 space-y-4">
          <h2 className="font-editorial text-xl font-bold text-white border-b border-[#222E40] pb-3">
            1. Basic Information
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-mono">
              Event Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Global Distributed Systems Summit 2026"
              className="w-full bg-[#0B0F17] border border-[#222E40] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-gold-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-mono">
                Start Date &amp; Time
              </label>
              <input
                type="datetime-local"
                required
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full bg-[#0B0F17] border border-[#222E40] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-mono">
                End Date &amp; Time
              </label>
              <input
                type="datetime-local"
                required
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full bg-[#0B0F17] border border-[#222E40] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-gold-500"
              />
            </div>
          </div>
        </div>

        {/* Live Markdown Editor & Preview */}
        <div className="editorial-card p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-[#222E40] pb-3">
            <h2 className="font-editorial text-xl font-bold text-white">
              2. Event Description &amp; Schedule (Markdown)
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewMarkdown(false)}
                className={`px-3 py-1 text-xs font-mono rounded ${!previewMarkdown ? 'bg-burgundy-700 text-gold-300 font-bold' : 'text-slate-400'}`}
              >
                <Edit3 className="w-3.5 h-3.5 inline mr-1" /> Edit
              </button>
              <button
                type="button"
                onClick={() => setPreviewMarkdown(true)}
                className={`px-3 py-1 text-xs font-mono rounded ${previewMarkdown ? 'bg-burgundy-700 text-gold-300 font-bold' : 'text-slate-400'}`}
              >
                <Eye className="w-3.5 h-3.5 inline mr-1" /> Preview
              </button>
            </div>
          </div>

          {previewMarkdown ? (
            <div className="prose prose-invert prose-gold max-w-none p-4 rounded-xl bg-[#0B0F17] border border-[#222E40] min-h-[220px]">
              <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                {descriptionMarkdown}
              </ReactMarkdown>
            </div>
          ) : (
            <textarea
              required
              rows={8}
              value={descriptionMarkdown}
              onChange={e => setDescriptionMarkdown(e.target.value)}
              className="w-full bg-[#0B0F17] border border-[#222E40] rounded-lg p-3.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-gold-500"
            />
          )}
        </div>

        {/* Venue Coordinates Pinpicker */}
        <div className="editorial-card p-6 sm:p-8 space-y-4">
          <h2 className="font-editorial text-xl font-bold text-white border-b border-[#222E40] pb-3">
            3. Venue Geolocation &amp; Anti-Scam Geofence
          </h2>

          {/* Quick Presets */}
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase block mb-1.5">
              Quick Venue Presets (India Metros):
            </span>
            <div className="flex flex-wrap gap-2">
              {VENUE_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="px-2.5 py-1 text-xs font-mono rounded bg-[#0B0F17] border border-[#222E40] hover:border-gold-500/50 text-slate-300"
                >
                  {p.name.split(',')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-mono">
                Venue Name
              </label>
              <input
                type="text"
                required
                value={venueName}
                onChange={e => setVenueName(e.target.value)}
                placeholder="e.g. Nimhans Convention Centre, Auditorium A"
                className="w-full bg-[#0B0F17] border border-[#222E40] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-mono">
                Venue Full Street Address
              </label>
              <input
                type="text"
                required
                value={venueAddress}
                onChange={e => setVenueAddress(e.target.value)}
                placeholder="Hosur Main Road, Lakkasandra, Bengaluru"
                className="w-full bg-[#0B0F17] border border-[#222E40] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-gold-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-mono">
                Exact Latitude (Decimal Degrees)
              </label>
              <input
                type="number"
                step="0.0000001"
                required
                value={venueLatitude}
                onChange={e => setVenueLatitude(parseFloat(e.target.value))}
                className="w-full bg-[#0B0F17] border border-[#222E40] rounded-lg px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-mono">
                Exact Longitude (Decimal Degrees)
              </label>
              <input
                type="number"
                step="0.0000001"
                required
                value={venueLongitude}
                onChange={e => setVenueLongitude(parseFloat(e.target.value))}
                className="w-full bg-[#0B0F17] border border-[#222E40] rounded-lg px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-gold-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-mono">
              Venue Booking Proof Document URL (Required for Live Approval)
            </label>
            <input
              type="url"
              required
              value={venueBookingProofUrl}
              onChange={e => setVenueBookingProofUrl(e.target.value)}
              placeholder="https://storage.antiscam.io/venues/auditorium_booking_deed.pdf"
              className="w-full bg-[#0B0F17] border border-[#222E40] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-gold-500"
            />
          </div>
        </div>

        {/* Ticket Tiers Configuration */}
        <div className="editorial-card p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-[#222E40] pb-3">
            <h2 className="font-editorial text-xl font-bold text-white">
              4. Ticket Tiers &amp; Capacity
            </h2>
            <button
              type="button"
              onClick={handleAddTier}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1D2738] hover:bg-[#253247] text-gold-300 border border-gold-500/30 text-xs font-mono font-bold"
            >
              <Plus className="w-3.5 h-3.5" /> Add Tier
            </button>
          </div>

          <div className="space-y-3">
            {ticketTiers.map((tier, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-[#0B0F17] p-3.5 rounded-xl border border-[#222E40] items-center">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1">Tier Name</label>
                  <input
                    type="text"
                    required
                    value={tier.name}
                    onChange={e => handleTierChange(idx, 'name', e.target.value)}
                    placeholder="Tier Name"
                    className="w-full bg-[#131A26] border border-[#222E40] rounded px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1">Price (INR)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={tier.price}
                    onChange={e => handleTierChange(idx, 'price', parseFloat(e.target.value))}
                    className="w-full bg-[#131A26] border border-[#222E40] rounded px-2.5 py-1.5 text-xs text-gold-300 font-mono font-bold"
                  />
                </div>

                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1">Capacity</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={tier.totalCapacity}
                      onChange={e => handleTierChange(idx, 'totalCapacity', parseInt(e.target.value))}
                      className="w-full bg-[#131A26] border border-[#222E40] rounded px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                  {ticketTiers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTier(idx)}
                      className="p-2 text-slate-500 hover:text-rose-400 mb-0.5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-xl bg-burgundy-700 hover:bg-burgundy-600 border border-gold-500/50 text-gold-200 text-base font-bold shadow-2xl transition-all disabled:opacity-50"
        >
          {loading ? 'Submitting to Verification Queue...' : 'Publish Event Listing with Escrow Protection'}
        </button>
      </form>
    </div>
  );
};
