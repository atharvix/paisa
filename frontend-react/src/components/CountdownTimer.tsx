import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface Props {
  targetIso: string;
}

export const CountdownTimer: React.FC<Props> = ({ targetIso }) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; isPassed: boolean }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPassed: false,
  });

  useEffect(() => {
    const calculate = () => {
      const target = new Date(targetIso).getTime();
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isPassed: true });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, isPassed: false });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetIso]);

  if (timeLeft.isPassed) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 bg-emerald-950/50 px-2.5 py-1 rounded border border-emerald-500/30">
        <Clock className="w-3.5 h-3.5" />
        MATURE FOR RELEASE
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-gold-300 bg-[#1D2738] px-3 py-1 rounded border border-gold-500/30">
      <Clock className="w-3.5 h-3.5 text-gold-400 animate-pulse" />
      <span>
        {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
      </span>
      <span className="text-[10px] text-slate-400 font-sans">remaining</span>
    </div>
  );
};
