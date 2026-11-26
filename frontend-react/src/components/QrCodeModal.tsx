import React, { useRef, useEffect } from 'react';
import { Ticket } from '../types';
import { X, ShieldCheck, MapPin, Calendar, CheckCircle2 } from 'lucide-react';

interface Props {
  ticket: Ticket;
  onClose: () => void;
}

export const QrCodeModal: React.FC<Props> = ({ ticket, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw high-resolution procedural QR grid pattern with crypto watermark
    const size = 260;
    canvas.width = size;
    canvas.height = size;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);

    // Procedural pseudo-random matrix based on ticket number hash
    const seed = ticket.ticketNumber + ticket.qrCodeSignature;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }

    const gridSize = 26;
    const cellSize = size / gridSize;

    // Draw position finder patterns (corners)
    const drawFinder = (x: number, y: number) => {
      ctx.fillStyle = '#0B0F17';
      ctx.fillRect(x * cellSize, y * cellSize, 7 * cellSize, 7 * cellSize);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect((x + 1) * cellSize, (y + 1) * cellSize, 5 * cellSize, 5 * cellSize);
      ctx.fillStyle = '#4A0E1C'; // Brand Burgundy center
      ctx.fillRect((x + 2) * cellSize, (y + 2) * cellSize, 3 * cellSize, 3 * cellSize);
    };

    drawFinder(1, 1);
    drawFinder(gridSize - 8, 1);
    drawFinder(1, gridSize - 8);

    // Populate data cells
    ctx.fillStyle = '#1A2333';
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        // Skip corner finder zones
        if ((r < 8 && c < 8) || (r < 8 && c >= gridSize - 8) || (r >= gridSize - 8 && c < 8)) {
          continue;
        }
        const val = Math.abs(Math.sin((r * 31 + c * 17 + hash) * 9999));
        if (val > 0.52) {
          ctx.fillRect(c * cellSize, r * cellSize, cellSize - 0.5, cellSize - 0.5);
        }
      }
    }

    // Center Shield Icon Overlay
    const centerSize = 44;
    const centerPos = (size - centerSize) / 2;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(centerPos - 2, centerPos - 2, centerSize + 4, centerSize + 4);
    ctx.fillStyle = '#4A0E1C';
    ctx.fillRect(centerPos, centerPos, centerSize, centerSize);
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 18px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VTX', size / 2, size / 2);
  }, [ticket]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#131A26] border border-gold-500/50 rounded-2xl p-6 shadow-2xl text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Verification Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold mb-4">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Cryptographically Signed QR Pass
        </div>

        <h3 className="font-editorial text-2xl font-bold text-white mb-1">
          {ticket.eventTitle}
        </h3>
        <p className="text-xs text-gold-400 font-mono mb-4">{ticket.tierName} • Pass #{ticket.ticketNumber}</p>

        {/* QR Canvas */}
        <div className="bg-white p-4 rounded-xl inline-block shadow-inner mb-4">
          <canvas ref={canvasRef} className="rounded-lg" />
        </div>

        {/* Status Badge */}
        <div className="mb-4">
          {ticket.status === 'CHECKED_IN' ? (
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold font-mono">
              <CheckCircle2 className="w-4 h-4" /> CHECKED IN AT VENUE
            </div>
          ) : ticket.status === 'PAID_HELD_IN_ESCROW' ? (
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gold-500/20 text-gold-300 border border-gold-500/40 text-xs font-bold font-mono">
              ESCROW LOCKED • VALID FOR ENTRY
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold font-mono">
              {ticket.status}
            </div>
          )}
        </div>

        {/* Venue Info */}
        <div className="bg-[#0B0F17] p-3.5 rounded-xl border border-[#222E40] text-left text-xs space-y-2 mb-4">
          <div className="flex items-start gap-2 text-slate-300">
            <MapPin className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">{ticket.venueName}</p>
              <p className="text-slate-400 text-[11px]">{ticket.venueAddress}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-400 pt-1 border-t border-slate-800">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{new Date(ticket.startTime).toLocaleString()}</span>
          </div>
        </div>

        {/* Security Signature Hash */}
        <div className="text-[10px] font-mono text-slate-500 truncate">
          HMAC: {ticket.qrCodeSignature}
        </div>
      </div>
    </div>
  );
};
